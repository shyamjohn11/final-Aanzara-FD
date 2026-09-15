import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");

type User = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  password: string;
  accountType: string;
  createdAt: string;
};

function getUsers(): User[] {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, "[]", "utf8");
    }

    const content = fs.readFileSync(usersFile, "utf8");

    if (!content.trim()) {
      return [];
    }

    const parsed = JSON.parse(content);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return [];
  }
}

function saveUsers(users: User[]) {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(
      usersFile,
      JSON.stringify(users, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("SAVE USERS ERROR:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      mobile,
      email,
      password,
      accountType,
    } = body;

    // -----------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------

    if (!name || !mobile || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // NORMALIZE DATA
    // -----------------------------------------

    const normalizedName = String(name).trim();

    const normalizedMobile = String(mobile)
      .replace(/\D/g, "")
      .trim();

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    // -----------------------------------------
    // MOBILE VALIDATION
    // -----------------------------------------

    if (!/^\d{10}$/.test(normalizedMobile)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // EMAIL VALIDATION
    // -----------------------------------------

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // PASSWORD VALIDATION
    // -----------------------------------------

    if (String(password).length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------
    // GET USERS
    // -----------------------------------------

    const users = getUsers();

    // -----------------------------------------
    // DUPLICATE CHECK
    // -----------------------------------------

    const emailExists = users.some(
      (user) =>
        String(user.email || "")
          .trim()
          .toLowerCase() === normalizedEmail
    );

    const mobileExists = users.some(
      (user) =>
        String(user.mobile || "")
          .replace(/\D/g, "")
          .trim() === normalizedMobile
    );

    // Email already exists
    if (emailExists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This email address is already registered. Please sign in.",
          field: "email",
        },
        { status: 409 }
      );
    }

    // Mobile already exists
    if (mobileExists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This mobile number is already registered. Please sign in.",
          field: "mobile",
        },
        { status: 409 }
      );
    }

    // -----------------------------------------
    // CREATE USER
    // -----------------------------------------

    const user: User = {
      id: Date.now().toString(),
      name: normalizedName,
      mobile: normalizedMobile,
      email: normalizedEmail,
      password: String(password),
      accountType:
        accountType === "business"
          ? "business"
          : "customer",
      createdAt: new Date().toISOString(),
    };

    // -----------------------------------------
    // SAVE USER
    // -----------------------------------------

    users.push(user);

    saveUsers(users);

    // -----------------------------------------
    // SUCCESS
    // -----------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful.",
        user: {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          email: user.email,
          accountType: user.accountType,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Registration failed. Please try again.",
      },
      { status: 500 }
    );
  }
}