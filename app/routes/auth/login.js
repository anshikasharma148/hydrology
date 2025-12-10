import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req) {
  const { email, password } = await req.json();

  if (email === "admin@example.com" && password === "password123") {
    const token = jwt.sign({ email }, process.env.SECRET_KEY, { expiresIn: "1h" });
    return NextResponse.json({ token });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}
