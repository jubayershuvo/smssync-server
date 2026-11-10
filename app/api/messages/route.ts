/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import SMS from "@/models/SMS";
import {
  ApiError, Input, RL, authenticate, bodyToInput, bool, buildFilter, csvCell, errorResponse,
  int, list, paramsToInput, reply, snippet, str, tzString,
} from "@/lib/smsQuery";

const FIELDS = ["_id", "deviceId", "messageId", "sender", "receiver", "body", "receivedAt", "simSlot", "type", "createdAt", "updatedAt"];
const SORTS = ["receivedAt", "createdAt", "sender", "receiver", "deviceId", "type"];
type Auth = { userId: mongoose.Types.ObjectId; rl: RL };

// ───────────────────────── search ─────────────────────────
async function search(auth: Auth, input: Input) {
  const started = Date.now();
  const { and, parsed, terms } = buildFilter(input);
  const base = [{ user: auth.userId }, ...and];
  const scoped = (extra: any[] = []) => ({ $and: [...base, ...extra] });
  const rl = auth.rl;

  // count only
  if (bool(input, "count")) {
    const count = await SMS.countDocuments(scoped() as any);
    return reply({ success: true, count, meta: { tookMs: Date.now() - started, query: parsed } }, 200, rl);
  }

  // group / aggregate
  const group = str(input, "group");
  if (group) {
    const tz = tzString(parsed.tz);
    const G: Record<string, any> = {
      sender: "$sender", receiver: "$receiver", deviceId: "$deviceId", type: "$type", simSlot: "$simSlot",
      day: { $dateToString: { format: "%Y-%m-%d", date: "$receivedAt", timezone: tz } },
      hour: { $dateToString: { format: "%Y-%m-%d %H:00", date: "$receivedAt", timezone: tz } },
      month: { $dateToString: { format: "%Y-%m", date: "$receivedAt", timezone: tz } },
    };
    if (!G[group]) throw new ApiError(400, `group must be one of: ${Object.keys(G).join(", ")}`);
    const timeBased = ["day", "hour", "month"].includes(group);
    const cnt = (t: string) => ({ $sum: { $cond: [{ $eq: ["$type", t] }, 1, 0] } });
    const rows = await SMS.aggregate([
      { $match: scoped() },
      { $group: { _id: G[group], count: { $sum: 1 }, incoming: cnt("incoming"), outgoing: cnt("outgoing"), first: { $min: "$receivedAt" }, last: { $max: "$receivedAt" } } },
      { $sort: timeBased ? { _id: 1 } : { count: -1 } },
      { $limit: int(input, "groupLimit", 100, 1, 500) },
    ]);
    return reply({
      success: true, group,
      data: rows.map((r) => ({ key: r._id, count: r.count, incoming: r.incoming, outgoing: r.outgoing, first: r.first, last: r.last })),
      meta: { tookMs: Date.now() - started, query: parsed },
    }, 200, rl);
  }

  // listing options
  const format = str(input, "format") || "json";
  if (!["json", "csv", "ndjson"].includes(format)) throw new ApiError(400, "format must be json, csv or ndjson");
  const exporting = format !== "json";
  const limit = int(input, "limit", exporting ? 1000 : 50, 1, exporting ? 5000 : 500);

  const sortBy = str(input, "sortBy") || "receivedAt";
  if (!SORTS.includes(sortBy)) throw new ApiError(400, `sortBy must be one of: ${SORTS.join(", ")}`);
  const s = (str(input, "sort") || "newest").toLowerCase();
  if (!["newest", "oldest", "asc", "desc"].includes(s)) throw new ApiError(400, "sort must be newest, oldest, asc or desc");
  const dir: 1 | -1 = s === "oldest" || s === "asc" ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [sortBy]: dir, _id: dir };

  const fieldList = list(input, "fields").filter((f) => FIELDS.includes(f));
  const select = fieldList.length ? [...new Set([...fieldList, "_id", "receivedAt"])].join(" ") : "";

  // cursor (keyset) pagination
  const cursor = str(input, "cursor");
  const extra: any[] = [];
  let skip = 0;
  const page = int(input, "page", 1, 1, 1_000_000);
  if (cursor) {
    if (sortBy !== "receivedAt") throw new ApiError(400, "cursor pagination requires sortBy=receivedAt");
    const [ms, id] = Buffer.from(cursor, "base64url").toString().split("_");
    if (!ms || !mongoose.isValidObjectId(id) || Number.isNaN(Number(ms))) throw new ApiError(400, "Invalid cursor");
    const op = dir === -1 ? "$lt" : "$gt";
    const d = new Date(Number(ms));
    extra.push({ $or: [{ receivedAt: { [op]: d } }, { receivedAt: d, _id: { [op]: new mongoose.Types.ObjectId(id) } }] });
  } else {
    skip = (page - 1) * limit;
    if (skip > 100_000) throw new ApiError(400, "Page too deep. Use cursor pagination (cursor=...) for large offsets.");
  }

  const wantTotal = str(input, "total") !== "false";
  const [rows, total] = await Promise.all([
    SMS.find(scoped(extra) as any).select(select).sort(sort).skip(skip).limit(limit).lean(),
    wantTotal ? SMS.countDocuments(scoped() as any) : Promise.resolve(-1),
  ]);

  if (exporting) {
    const cols = fieldList.length ? fieldList : ["_id", "deviceId", "messageId", "sender", "receiver", "body", "receivedAt", "simSlot", "type"];
    const stamp = new Date().toISOString().slice(0, 10);
    const text = format === "csv"
      ? [cols.join(","), ...rows.map((r: any) => cols.map((c) => csvCell(r[c])).join(","))].join("\n")
      : rows.map((r: any) => JSON.stringify(r)).join("\n");
    return reply(text, 200, rl, {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/x-ndjson",
      "Content-Disposition": `attachment; filename="sms-export-${stamp}.${format === "csv" ? "csv" : "ndjson"}"`,
    });
  }

  const hl = bool(input, "highlight");
  const data = rows.map((r: any) => (hl && r.body ? { ...r, highlight: snippet(r.body, terms) } : r));
  const last: any = rows[rows.length - 1];
  const hasNext = wantTotal && !cursor ? skip + rows.length < total : rows.length === limit;
  const nextCursor = hasNext && last?.receivedAt
    ? Buffer.from(`${new Date(last.receivedAt).getTime()}_${last._id}`).toString("base64url")
    : null;

  return reply({
    success: true,
    data,
    pagination: {
      total: wantTotal ? total : undefined,
      page: cursor ? undefined : page,
      limit,
      totalPages: wantTotal ? Math.max(1, Math.ceil(total / limit)) : undefined,
      hasNextPage: hasNext,
      hasPreviousPage: cursor ? undefined : page > 1,
      nextCursor,
    },
    meta: { tookMs: Date.now() - started, sort: { by: sortBy, order: dir === 1 ? "asc" : "desc" }, query: parsed },
  }, 200, rl);
}

// ───────────────────────── delete ─────────────────────────
async function remove(auth: Auth, input: Input) {
  const { and, hasFilter, parsed } = buildFilter(input);
  const ids = list(input, "ids", 1000);
  const messageIds = list(input, "messageIds", 1000);
  for (const id of ids) if (!mongoose.isValidObjectId(id)) throw new ApiError(400, `Invalid id: ${id}`);

  const extra: any[] = [];
  if (ids.length) extra.push({ _id: { $in: ids.map((i) => new mongoose.Types.ObjectId(i)) } });
  if (messageIds.length) extra.push({ messageId: { $in: messageIds } });

  if (!hasFilter && !extra.length && !bool(input, "confirmAll")) {
    throw new ApiError(400, "Refusing to delete everything. Provide a filter, ids, or confirmAll: true.");
  }

  const filter: any = { $and: [{ user: auth.userId }, ...and, ...extra] };
  const matched = await SMS.countDocuments(filter);

  if (bool(input, "dryRun")) {
    const sample = await SMS.find(filter).sort({ receivedAt: -1 }).limit(5).select("deviceId sender receiver body receivedAt type").lean();
    return reply({ success: true, dryRun: true, matched, sample, meta: { query: parsed } }, 200, auth.rl);
  }

  if (matched > 1000 && int(input, "confirmCount", -1, -1, 1e9) !== matched) {
    throw new ApiError(409, `This would delete ${matched} messages. Repeat the request with confirmCount: ${matched} to proceed.`,
      { matched, confirmCount: matched }, auth.rl);
  }

  const result = await SMS.deleteMany(filter);
  return reply({ success: true, message: "SMS deleted successfully", matched, deletedCount: result.deletedCount }, 200, auth.rl);
}

// ───────────────────────── handlers ─────────────────────────
async function readBody(req: NextRequest) {
  try { return await req.json(); } catch { return null; }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await authenticate(req);
    return await search(auth, paramsToInput(req.nextUrl.searchParams));
  } catch (e) { return errorResponse(e); }
}

// POST { action: "search" | "count" | "delete", filters?: {...}, ...filters }
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await authenticate(req);
    const raw = await readBody(req);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new ApiError(400, "Invalid JSON body");
    const body = raw as Record<string, unknown>;
    const filters = body.filters && typeof body.filters === "object" && !Array.isArray(body.filters) ? body.filters : body;
    const input = { ...bodyToInput(filters), ...bodyToInput({ ...body, filters: undefined }) };
    switch (body.action) {
      case "search": return await search(auth, input);
      case "count": return await search(auth, { ...input, count: true });
      case "delete": return await remove(auth, input);
      default: throw new ApiError(400, "action must be one of: search, count, delete");
    }
  } catch (e) { return errorResponse(e); }
}

// DELETE /api/messages?<filters>  (query string and/or JSON body)
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const auth = await authenticate(req);
    const body = await readBody(req);
    return await remove(auth, { ...paramsToInput(req.nextUrl.searchParams), ...bodyToInput(body?.filters ?? body) });
  } catch (e) { return errorResponse(e); }
}
