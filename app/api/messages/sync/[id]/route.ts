
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import SMS from "@/models/SMS";

interface SMSRequest {
    deviceId: string;
    messageId: string;
    sender: string;
    body: string;
    receivedAt: string;
    simSlot: number;
    type: "incoming" | "outgoing";
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Get User ID from URL
        const { id: userId } = await params;

        if (!mongoose.isValidObjectId(userId)) {
            return NextResponse.json(
                { success: false, error: "Invalid user ID" },
                { status: 400 }
            );
        }

        // Parse JSON body
        let data: SMSRequest;

        try {
            data = await request.json();
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid JSON body" },
                { status: 400 }
            );
        }

        // Validate required fields
        if (
            !data ||
            typeof data.deviceId !== "string" ||
            !data.deviceId.trim() ||
            typeof data.messageId !== "string" ||
            !data.messageId.trim() ||
            typeof data.sender !== "string" ||
            typeof data.body !== "string" ||
            typeof data.receivedAt !== "string" ||
            !Number.isInteger(data.simSlot) ||
            !["incoming", "outgoing"].includes(data.type)
        ) {
            return NextResponse.json(
                { success: false, error: "Invalid or missing SMS fields" },
                { status: 400 }
            );
        }

        const receivedAt = new Date(data.receivedAt);

        if (Number.isNaN(receivedAt.getTime())) {
            return NextResponse.json(
                { success: false, error: "Invalid receivedAt date" },
                { status: 400 }
            );
        }

        await connectDB();


        // Check user
        const user = await User.findById(userId).select("_id");

        if (!user) {
            return NextResponse.json(
                { success: false, error: "User not found" },
                { status: 404 }
            );
        }

        // Save SMS (prevent duplicates)
        const result = await SMS.updateOne(
            {
                user: user._id,
                deviceId: data.deviceId.trim(),
                messageId: data.messageId.trim(),
            },
            {
                $setOnInsert: {
                    user: user._id,
                    deviceId: data.deviceId.trim(),
                    messageId: data.messageId.trim(),
                    sender: data.sender.trim(),
                    body: data.body,
                    receivedAt,
                    simSlot: String(data.simSlot),
                    type: data.type,
                },
            },
            { upsert: true }
        );

        const inserted = result.upsertedCount === 1;

        return NextResponse.json({
            success: true,
            message: inserted
                ? "SMS synchronized successfully"
                : "SMS already synchronized",
            userId,
            messageId: data.messageId,
            inserted,
            duplicate: !inserted,
        });

    } catch (error) {
        console.error("SMS SYNC ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
            },
            { status: 500 }
        );
    }
}
