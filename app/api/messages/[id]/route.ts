import { NextRequest } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import SMS from "@/models/SMS";
import { ApiError, authenticate, errorResponse, reply } from "@/lib/smsQuery";

// :id may be a Mongo _id or a messageId (optionally narrowed with ?deviceId=)
async function locate(req: NextRequest, params: Promise<{ id: string }>) {
  const auth = await authenticate(req);
  const { id } = await params;
  const deviceId = req.nextUrl.searchParams.get("deviceId")?.trim();
  const filter: Record<string, unknown> = { user: auth.userId };
  if (mongoose.isValidObjectId(id)) filter._id = id;
  else { filter.messageId = id; if (deviceId) filter.deviceId = deviceId; }
  return { auth, filter };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { auth, filter } = await locate(req, params);
    const message = await SMS.findOne(filter as never).lean();
    if (!message) throw new ApiError(404, "Message not found", undefined, auth.rl);
    return reply({ success: true, data: message }, 200, auth.rl);
  } catch (e) { return errorResponse(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { auth, filter } = await locate(req, params);
    const r = await SMS.deleteOne(filter as never);
    if (!r.deletedCount) throw new ApiError(404, "Message not found", undefined, auth.rl);
    return reply({ success: true, deletedCount: 1 }, 200, auth.rl);
  } catch (e) { return errorResponse(e); }
}
