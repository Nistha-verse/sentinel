import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    status: "ok",
    version: process.env.npm_package_version ?? "1.0.0",
  });
}
