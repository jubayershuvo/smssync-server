import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { hashPassword, signToken } from "@/lib/auth";
import { rethrowNext } from "@/lib/nextErrors";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, username, email, password } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const emailExists = await User.findOne({ email }).select("_id");
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: "Email already in use" },
        { status: 409 }
      );
    }

    const usernameExists = await User.findOne({ username }).select("_id");
    if (usernameExists) {
      return NextResponse.json(
        { success: false, error: "Username already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
    });

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
        token,
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    rethrowNext(error);
    console.error("SIGNUP ERROR:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
