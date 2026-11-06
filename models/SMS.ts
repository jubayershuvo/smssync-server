
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISMS extends Document {
    user: mongoose.Types.ObjectId;
    deviceId: string;
    messageId: string;
    sender: string;
    body: string;
    receivedAt: Date;
    simSlot: string;
    type: string;
}

const SMSSchema = new Schema<ISMS>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        deviceId: {
            type: String,
            required: true,
            trim: true,
        },
        messageId: {
            type: String,
            required: true,
            trim: true,
        },
        sender: {
            type: String,
            default: "",
        },
        body: {
            type: String,
            default: "",
        },
        receivedAt: {
            type: Date,
            required: true,
        },
        simSlot: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            enum: ["inbox", "sent", "draft", "other"],
            default: "inbox",
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate SMS synchronization
SMSSchema.index(
    { user: 1, deviceId: 1, messageId: 1 },
    { unique: true }
);

const SMS: Model<ISMS> =
    mongoose.models.SMS ||
    mongoose.model<ISMS>("SMS", SMSSchema);

export default SMS;
