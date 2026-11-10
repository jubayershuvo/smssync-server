/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import User from "@/models/User";
import { rethrowNext } from "@/lib/nextErrors";

export type Filter = Record<string, any>;
export type Input = Record<string, string | number | boolean | (string | number)[] | null | undefined>;

// ───────────────────────── errors / responses ─────────────────────────
export type RL = { ok: boolean; limit: number; remaining: number; reset: number };

export class ApiError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  rl?: RL;
  constructor(status: number, message: string, extra?: Record<string, unknown>, rl?: RL) {
    super(message);
    this.status = status;
    this.extra = extra;
    this.rl = rl;
  }
}

export function reply(data: unknown, status = 200, rl?: RL, headers: Record<string, string> = {}) {
  const res = NextResponse.json(data, { status });
  if (rl) {
    res.headers.set("X-RateLimit-Limit", String(rl.limit));
    res.headers.set("X-RateLimit-Remaining", String(rl.remaining));
    res.headers.set("X-RateLimit-Reset", String(rl.reset));
  }
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}

export function errorResponse(e: unknown) {
  rethrowNext(e);
  if (e instanceof ApiError) return reply({ success: false, error: e.message, ...e.extra }, e.status, e.rl);
  console.error("MESSAGES API ERROR:", e);
  return reply({ success: false, error: "Internal server error" }, 500);
}

// ───────────────────────── auth + rate limit ─────────────────────────
const buckets = new Map<string, { n: number; t: number }>();
function rateLimit(key: string, max = 120, windowMs = 60_000): RL {
  const now = Date.now();
  if (buckets.size > 5000) for (const [k, v] of buckets) if (now - v.t > windowMs) buckets.delete(k);
  let b = buckets.get(key);
  if (!b || now - b.t > windowMs) { b = { n: 0, t: now }; buckets.set(key, b); }
  b.n++;
  return { ok: b.n <= max, limit: max, remaining: Math.max(0, max - b.n), reset: Math.ceil((b.t + windowMs) / 1000) };
}

export async function authenticate(req: NextRequest) {
  const authz = req.headers.get("authorization");
  const key = (req.headers.get("x-api-key") || (authz?.startsWith("Bearer ") ? authz.slice(7) : "")).trim();
  if (!key) throw new ApiError(401, "Missing API key. Send 'Authorization: Bearer <apiKey>' or 'X-API-Key: <apiKey>'.");
  const user = await User.findOne({ apiKey: key }).select("_id").lean();
  if (!user) throw new ApiError(401, "Invalid API key");
  const rl = rateLimit(String(user._id));
  if (!rl.ok) throw new ApiError(429, "Rate limit exceeded (120 requests/minute)", { resetAt: rl.reset }, rl);
  return { userId: user._id as mongoose.Types.ObjectId, rl };
}

// ───────────────────────── input helpers ─────────────────────────
export const str = (i: Input, k: string) => {
  const v = i[k];
  if (v == null) return "";
  return (Array.isArray(v) ? v.join(",") : String(v)).trim();
};
export const list = (i: Input, k: string, max = 100) => {
  const v = i[k];
  if (v == null) return [];
  const arr = Array.isArray(v) ? v.map(String) : String(v).split(",");
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))].slice(0, max);
};
export const bool = (i: Input, k: string) => i[k] === true || i[k] === "true" || i[k] === "1" || i[k] === 1;
export function int(i: Input, k: string, def: number, min: number, max: number) {
  const s = str(i, k);
  if (!s) return def;
  const n = Number(s);
  if (!Number.isInteger(n)) throw new ApiError(400, `${k} must be an integer`);
  if (n < min || n > max) throw new ApiError(400, `${k} must be between ${min} and ${max}`);
  return n;
}
export function paramsToInput(p: URLSearchParams): Input {
  const o: Input = {};
  p.forEach((v, k) => { o[k] = v; });
  return o;
}
export function bodyToInput(raw: unknown): Input {
  const o: Input = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return o;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") o[k] = v;
    else if (Array.isArray(v)) o[k] = v.filter((x) => typeof x === "string" || typeof x === "number") as (string | number)[];
  }
  return o;
}

// ───────────────────────── regex + date helpers ─────────────────────────
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const ci = (s: string) => new RegExp(esc(s), "i");
function userRegex(s: string, name: string) {
  if (s.length > 120) throw new ApiError(400, `${name} is too long (max 120 chars)`);
  try { new RegExp(s); } catch { throw new ApiError(400, `${name} is not a valid regular expression`); }
  return new RegExp(s, "i");
}
const HAS: Record<string, RegExp> = {
  otp: /\b\d{4,8}\b/,
  link: /https?:\/\/|www\./i,
  digits: /\d/,
  email: /[\w.+-]+@[\w-]+\.[\w.-]+/,
  amount: /(?:[$€£৳]|BDT|Tk\.?|USD|INR|Rs\.?)\s?\d/i,
};
const DAY = 864e5;

export function tzString(min: number) {
  const s = min >= 0 ? "+" : "-";
  const a = Math.abs(min);
  return `${s}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

function parseDate(v: string, tz: number, name: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (m) {
    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) throw new ApiError(400, `${name} is not a valid date`);
    return { date: new Date(Date.UTC(y, mo - 1, d) - tz * 60_000), dayOnly: true };
  }
  const date = new Date(v);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `${name} is not a valid date (use YYYY-MM-DD or ISO 8601)`);
  return { date, dayOnly: false };
}

function presetRange(p: string, tz: number): [Date | null, Date | null] {
  const now = Date.now();
  const dayStart = (back: number) => new Date(now + tz * 6e4 - ((now + tz * 6e4) % DAY) - back * DAY - tz * 6e4);
  switch (p) {
    case "last1h": return [new Date(now - 36e5), null];
    case "last24h": return [new Date(now - DAY), null];
    case "last7d": return [new Date(now - 7 * DAY), null];
    case "last30d": return [new Date(now - 30 * DAY), null];
    case "today": return [dayStart(0), null];
    case "yesterday": return [dayStart(1), dayStart(0)];
    case "thisMonth": {
      const l = new Date(now + tz * 6e4);
      return [new Date(Date.UTC(l.getUTCFullYear(), l.getUTCMonth(), 1) - tz * 6e4), null];
    }
    default: throw new ApiError(400, "preset must be one of: last1h, last24h, last7d, last30d, today, yesterday, thisMonth");
  }
}

// ───────────────────────── the filter builder ─────────────────────────
const OPS = new Set(["from", "sender", "to", "receiver", "device", "type", "sim", "id", "after", "before", "on", "has", "body"]);
const TOKEN = /(-?)(?:([a-zA-Z]+):)?(?:"([^"]*)"|(\S+))/g;
const TYPES = ["incoming", "outgoing"];

export function buildFilter(input: Input) {
  const and: Filter[] = [];
  const tz = int(input, "tz", 0, -840, 840);

  const L = {
    sender: list(input, "sender"), senderNot: list(input, "senderNot"),
    senderHas: [] as string[], senderHasNot: [] as string[],
    receiver: list(input, "receiver"), receiverNot: list(input, "receiverNot"),
    receiverHas: [] as string[], receiverHasNot: [] as string[],
    device: [...list(input, "deviceId"), ...list(input, "device")], deviceNot: list(input, "deviceNot"),
    type: list(input, "type"), typeNot: [] as string[],
    sim: [...list(input, "simSlot"), ...list(input, "sim")],
    messageId: list(input, "messageId"),
    bodyHas: [] as string[], bodyNot: [] as string[],
    has: list(input, "has"), hasNot: [] as string[],
  };
  const textTerms: { v: string; neg: boolean }[] = [];
  const ranges: Filter[] = [];

  const sb = str(input, "senderSearch"); if (sb) L.senderHas.push(sb);
  const rb = str(input, "receiverSearch"); if (rb) L.receiverHas.push(rb);
  for (const k of ["body", "bodySearch"]) { const v = str(input, k); if (v) L.bodyHas.push(v); }
  const bn = str(input, "bodyNot"); if (bn) L.bodyNot.push(bn);
  const phrase = str(input, "phrase"); if (phrase) L.bodyHas.push(phrase);

  // ---- advanced q= syntax ----
  const q = str(input, "q");
  if (q.length > 500) throw new ApiError(400, "q is too long (max 500 chars)");
  const dateOps: { op: string; v: string }[] = [];
  for (const m of q.matchAll(TOKEN)) {
    const neg = m[1] === "-";
    const op = m[2]?.toLowerCase();
    const val = (m[3] ?? m[4] ?? "").trim();
    if (op && !OPS.has(op)) { textTerms.push({ v: `${m[2]}:${val}`, neg }); continue; }
    if (!val) continue;
    if (!op) { textTerms.push({ v: val, neg }); continue; }
    switch (op) {
      case "from": case "sender": (neg ? L.senderHasNot : L.senderHas).push(val); break;
      case "to": case "receiver": (neg ? L.receiverHasNot : L.receiverHas).push(val); break;
      case "device": (neg ? L.deviceNot : L.device).push(val); break;
      case "type": (neg ? L.typeNot : L.type).push(val.toLowerCase()); break;
      case "sim": L.sim.push(val); break;
      case "id": L.messageId.push(val); break;
      case "body": (neg ? L.bodyNot : L.bodyHas).push(val); break;
      case "has": (neg ? L.hasNot : L.has).push(val.toLowerCase()); break;
      default: dateOps.push({ op, v: val });
    }
  }

  // ---- exact / list filters ----
  const inList = (field: string, vals: string[], neg = false) => { if (vals.length) and.push({ [field]: { [neg ? "$nin" : "$in"]: vals } }); };
  for (const t of [...L.type, ...L.typeNot]) if (!TYPES.includes(t)) throw new ApiError(400, "type must be incoming or outgoing");
  inList("sender", L.sender); inList("sender", L.senderNot, true);
  inList("receiver", L.receiver); inList("receiver", L.receiverNot, true);
  inList("deviceId", L.device); inList("deviceId", L.deviceNot, true);
  inList("type", L.type); inList("type", L.typeNot, true);
  inList("simSlot", L.sim); inList("messageId", L.messageId);

  // ---- contains / regex ----
  for (const v of L.senderHas) and.push({ sender: ci(v) });
  for (const v of L.senderHasNot) and.push({ sender: { $not: ci(v) } });
  for (const v of L.receiverHas) and.push({ receiver: ci(v) });
  for (const v of L.receiverHasNot) and.push({ receiver: { $not: ci(v) } });
  for (const v of L.bodyHas) and.push({ body: ci(v) });
  for (const v of L.bodyNot) and.push({ body: { $not: ci(v) } });
  const ds = str(input, "deviceSearch"); if (ds) and.push({ deviceId: ci(ds) });
  const br = str(input, "bodyRegex"); if (br) and.push({ body: userRegex(br, "bodyRegex") });
  const sr = str(input, "senderRegex"); if (sr) and.push({ sender: userRegex(sr, "senderRegex") });
  const rr = str(input, "receiverRegex"); if (rr) and.push({ receiver: userRegex(rr, "receiverRegex") });
  const gs = str(input, "search");
  if (gs) { const r = ci(gs); and.push({ $or: [{ sender: r }, { receiver: r }, { body: r }, { deviceId: r }, { messageId: r }] }); }

  for (const h of L.has) { if (!HAS[h]) throw new ApiError(400, `has must be one of: ${Object.keys(HAS).join(", ")}`); and.push({ body: HAS[h] }); }
  for (const h of L.hasNot) { if (!HAS[h]) throw new ApiError(400, `has must be one of: ${Object.keys(HAS).join(", ")}`); and.push({ body: { $not: HAS[h] } }); }

  const minL = str(input, "minLength"), maxL = str(input, "maxLength");
  if (minL || maxL) {
    const c: Filter[] = [];
    if (minL) c.push({ $gte: [{ $strLenCP: "$body" }, int(input, "minLength", 0, 0, 100000)] });
    if (maxL) c.push({ $lte: [{ $strLenCP: "$body" }, int(input, "maxLength", 0, 0, 100000)] });
    and.push({ $expr: { $and: c } });
  }

  // ---- free-text terms (AND by default, OR with match=any) ----
  const pos = textTerms.filter((t) => !t.neg).map((t) => t.v);
  const neg = textTerms.filter((t) => t.neg).map((t) => t.v);
  const termCond = (v: string) => ({ $or: [{ body: ci(v) }, { sender: ci(v) }, { receiver: ci(v) }] });
  if (pos.length) {
    const mode = str(input, "match") || "all";
    if (!["all", "any"].includes(mode)) throw new ApiError(400, "match must be all or any");
    if (mode === "any") and.push({ $or: pos.map(termCond) });
    else pos.forEach((v) => and.push(termCond(v)));
  }
  neg.forEach((v) => and.push({ body: { $not: ci(v) }, sender: { $not: ci(v) }, receiver: { $not: ci(v) } }));

  // ---- dates ----
  const range = (field: "$gte" | "$gt" | "$lt" | "$lte", d: Date) => ranges.push({ receivedAt: { [field]: d } });
  const addFrom = (v: string, n: string) => range("$gte", parseDate(v, tz, n).date);
  const addTo = (v: string, n: string) => { const p = parseDate(v, tz, n); p.dayOnly ? range("$lt", new Date(p.date.getTime() + DAY)) : range("$lte", p.date); };
  const day = str(input, "date");
  if (day) { const p = parseDate(day, tz, "date"); if (p.dayOnly) { range("$gte", p.date); range("$lt", new Date(p.date.getTime() + DAY)); } else { range("$gte", p.date); range("$lt", new Date(p.date.getTime() + 1000)); } }
  if (str(input, "from")) addFrom(str(input, "from"), "from");
  if (str(input, "to")) addTo(str(input, "to"), "to");
  const pre = str(input, "preset");
  if (pre) { const [a, b] = presetRange(pre, tz); if (a) range("$gte", a); if (b) range("$lt", b); }
  for (const { op, v } of dateOps) {
    if (op === "after") addFrom(v, "after:");
    else if (op === "before") range("$lt", parseDate(v, tz, "before:").date);
    else if (op === "on") { const p = parseDate(v, tz, "on:"); range("$gte", p.date); range("$lt", new Date(p.date.getTime() + DAY)); }
  }
  and.push(...ranges);

  return {
    and,
    filter: (and.length ? { $and: and } : {}) as Filter,
    hasFilter: and.length > 0,
    terms: [...pos, ...L.bodyHas],
    parsed: { text: pos, excluded: neg, conditions: and.length, tz },
  };
}

export function snippet(body: string, terms: string[]) {
  const low = body.toLowerCase();
  for (const t of terms) {
    const i = low.indexOf(t.toLowerCase());
    if (i < 0) continue;
    const s = Math.max(0, i - 40), e = Math.min(body.length, i + t.length + 80);
    return `${s > 0 ? "…" : ""}${body.slice(s, i)}**${body.slice(i, i + t.length)}**${body.slice(i + t.length, e)}${e < body.length ? "…" : ""}`;
  }
  return null;
}

export function csvCell(v: unknown) {
  let s = v instanceof Date ? v.toISOString() : v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // CSV-injection guard
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
