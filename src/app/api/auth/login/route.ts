import { NextResponse } from "next/server";

// Demo/local auth is disabled — the real API owns login and registration.
// Kept as a 401 stub so any stray client calling /api/auth/* fails closed
// instead of silently hitting a plaintext users.json store.

export async function POST() {
  return NextResponse.json(
    {
      type: "https://httpstatuses.io/401",
      title: "Unauthorized",
      status: 401,
      detail: "Direct demo login is disabled. Use /api/v1/auth/login.",
      code: "auth.demo_disabled",
    },
    { status: 401, headers: { "Content-Type": "application/problem+json" } },
  );
}
