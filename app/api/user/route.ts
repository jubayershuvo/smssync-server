import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { getTokenFromRequest, verifyToken } from "@/lib/auth";
import { rethrowNext } from "@/lib/nextErrors";

const fail = (error: string, status = 400) =>
  NextResponse.json({ success: false, error }, { status });

async function getUser(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return { error: fail("Authorization token required", 401) };
  let decoded: { id?: string };
  try {
    decoded = verifyToken(token);
  } catch {
    return { error: fail("Invalid or expired token", 401) };
  }
  if (!decoded?.id) return { error: fail("Invalid or expired token", 401) };
  const user = await User.findById(decoded.id);
  if (!user) return { error: fail("User not found", 404) };
  return { user };
}

const publicUser = (u: InstanceType<typeof User>) => ({
  id: u._id.toString(),
  name: u.name,
  username: u.username,
  email: u.email,
  apiKey: u.apiKey,
  allowedDevices: u.allowedDevices,
});

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { user, error } = await getUser(request);
    if (error) return error;
    return NextResponse.json({ success: true, user: publicUser(user!) });
  } catch (e) {
    rethrowNext(e);
    console.error("USER GET ERROR:", e);
    return fail("Internal server error", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { user, error } = await getUser(request);
    if (error) return error;
    const u = user!;

    const body = await request.json();
    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";

    switch (body.action) {
      case "add-device": {
        if (!deviceId) return fail("Device ID is required");
        if (deviceId.length > 100) return fail("Device ID is too long");
        if (!u.allowedDevices.includes(deviceId)) {
          u.allowedDevices.push(deviceId);
          await u.save();
        }
        return NextResponse.json({ success: true, allowedDevices: u.allowedDevices });
      }
      case "remove-device": {
        if (!deviceId) return fail("Device ID is required");
        u.allowedDevices = u.allowedDevices.filter((d: string) => d !== deviceId);
        await u.save();
        return NextResponse.json({ success: true, allowedDevices: u.allowedDevices });
      }
      case "rotate-api-key": {
        u.apiKey = "sk_" + crypto.randomBytes(24).toString("hex");
        await u.save();
        return NextResponse.json({ success: true, apiKey: u.apiKey });
      }
      default:
        return fail("Unknown action");
    }
  } catch (e) {
    rethrowNext(e);
    console.error("USER POST ERROR:", e);
    return fail("Internal server error", 500);
  }
}
