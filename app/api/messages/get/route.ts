import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import SMS from "@/models/SMS";
import { rethrowNext } from "@/lib/nextErrors";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get("apiKey");

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API key is required" },
        { status: 400 }
      );
    }

    // Find user by apiKey
    const user = await User.findOne({ apiKey }).select("-password");
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401 }
      );
    }

    // Get messages for this user
    const messages = await SMS.find({ user: user._id })
      .sort({ receivedAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      messages: messages.map((sms) => ({
        id: sms._id,
        messageId: sms.messageId,
        sender: sms.sender,
        body: sms.body,
        receivedAt: sms.receivedAt,
        deviceId: sms.deviceId,
        type: sms.type,
        simSlot: sms.simSlot,
      })),
      total: await SMS.countDocuments({ user: user._id }),
    });
  } catch (error) {
    rethrowNext(error);
    console.error("MESSAGES GET ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}