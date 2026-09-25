import { NextResponse } from "next/server";

// Demo/local registration is disabled — the real API owns registration.

export async function POST() {
  return NextResponse.json(
    {
      type: "https://httpstatuses.io/401",
      title: "Unauthorized",
      status: 401,
      detail: "Direct demo registration is disabled. Use /api/v1/auth/register.",
      code: "auth.demo_disabled",
    },
    { status: 401, headers: { "Content-Type": "application/problem+json" } },
  );
}
