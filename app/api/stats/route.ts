import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import SMS from "@/models/SMS";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { rethrowNext } from "@/lib/nextErrors";

const DAY = 864e5;
const PAGE_SIZE = 15;

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    let decoded: { id?: string };
    try {
      decoded = verifyToken(token);
    } catch {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }
    await connectDB();
    const uid = new mongoose.Types.ObjectId(decoded.id);

    const sp = request.nextUrl.searchParams;
    const q = (sp.get("q") || "").trim();
    const device = (sp.get("device") || "").trim();
    const type = (sp.get("type") || "").trim();
    const page = Math.max(1, Number(sp.get("page") || 1) || 1);

    const startToday = new Date();
    startToday.setUTCHours(0, 0, 0, 0);
    const since14 = new Date(startToday.getTime() - 13 * DAY);
    const since7 = new Date(startToday.getTime() - 6 * DAY);
    const cnt = (cond: object) => ({ $sum: { $cond: [cond, 1, 0] } });

    const filter: Record<string, unknown> = { user: uid };
    if (device) filter.deviceId = device;
    if (type === "incoming" || type === "outgoing") filter.type = type;
    if (q) {
      const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
      filter.$or = [{ sender: rx }, { body: rx }];
    }

    const [totals, daily, byDevice, topSenders, messages, filteredTotal] = await Promise.all([
      SMS.aggregate([
        { $match: { user: uid } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            incoming: cnt({ $eq: ["$type", "incoming"] }),
            outgoing: cnt({ $eq: ["$type", "outgoing"] }),
            today: cnt({ $gte: ["$receivedAt", startToday] }),
            week: cnt({ $gte: ["$receivedAt", since7] }),
            lastAt: { $max: "$receivedAt" },
          },
        },
      ]),
      SMS.aggregate([
        { $match: { user: uid, receivedAt: { $gte: since14 } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$receivedAt" } },
            incoming: cnt({ $eq: ["$type", "incoming"] }),
            outgoing: cnt({ $eq: ["$type", "outgoing"] }),
          },
        },
      ]),
      SMS.aggregate([
        { $match: { user: uid } },
        { $group: { _id: "$deviceId", count: { $sum: 1 }, lastAt: { $max: "$receivedAt" } } },
        { $sort: { count: -1 } },
      ]),
      SMS.aggregate([
        { $match: { user: uid, type: "incoming", sender: { $ne: "" } } },
        { $group: { _id: "$sender", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
      SMS.find(filter)
        .sort({ receivedAt: -1, _id: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .select("deviceId sender body receivedAt simSlot type receiver")
        .lean(),
      SMS.countDocuments(filter),
    ]);

    const map = new Map(daily.map((d) => [d._id as string, d]));
    const series = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(since14.getTime() + i * DAY).toISOString().slice(0, 10);
      const d = map.get(date);
      return { date, incoming: d?.incoming ?? 0, outgoing: d?.outgoing ?? 0 };
    });

    const t = totals[0] || { total: 0, incoming: 0, outgoing: 0, today: 0, week: 0, lastAt: null };
    return NextResponse.json({
      success: true,
      totals: { total: t.total, incoming: t.incoming, outgoing: t.outgoing, today: t.today, week: t.week, lastAt: t.lastAt },
      series,
      devices: byDevice.map((d) => ({ deviceId: d._id, count: d.count, lastAt: d.lastAt })),
      topSenders: topSenders.map((s) => ({ sender: s._id, count: s.count })),
      messages: messages.map((m) => ({ ...m, _id: String(m._id) })),
      pagination: { page, pageSize: PAGE_SIZE, total: filteredTotal, totalPages: Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE)) },
    });
  } catch (e) {
    rethrowNext(e);
    console.error("STATS ERROR:", e);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
