import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");

function getUsers() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, "[]", "utf8");
  }

  const content = fs.readFileSync(usersFile, "utf8");

  try {
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      email,
      password,
      accountType,
    } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email and password are required.",
        },
        { status: 400 }
      );
    }

    const users = getUsers();

    const loginValue =
      email.trim().toLowerCase();

    const user = users.find(
      (item: any) =>
        (
          item.email?.toLowerCase() ===
            loginValue ||
          item.mobile === email.trim()
        ) &&
        item.password === password
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid email or password.",
        },
        { status: 401 }
      );
    }

    if (
      accountType &&
      user.accountType !== accountType
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Account type does not match.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        accountType: user.accountType,
      },
    });

    response.cookies.set(
      "aanzara_user",
      JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return response;
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Login failed.",
      },
      { status: 500 }
    );
  }
}