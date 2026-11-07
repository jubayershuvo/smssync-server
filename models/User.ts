
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    name: string;
    username: string;
    email: string;
    password: string;
    apiKey: string;
    allowedDevices: string[];
}

const UserSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            default: "",
            trim: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
        apiKey: {
            type: String,
            default: ""
        },
        allowedDevices: {
            type: [String],
            default: [],
        }
    },
    {
        timestamps: true,
    }
);

const User: Model<IUser> =
    mongoose.models.User ||
    mongoose.model<IUser>("User", UserSchema);

export default User;
