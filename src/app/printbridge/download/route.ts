import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  // Redirect to the PrintBridge setup and download page at /printbridge
  return NextResponse.redirect(new URL("/printbridge", url.origin));
}

