import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { hashPin, verifyPin } from "@/lib/auth/password";

export async function GET(request) {
  const response = NextResponse.next();
  const session = await getIronSession(request, response, sessionOptions);

  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    userId: session.userId,
    shopId: session.shopId,
    departmentId: session.departmentId,
    username: session.username,
  });
}

export async function PATCH(request) {
  const response = NextResponse.next();
  const session = await getIronSession(request, response, sessionOptions);

  if (!session.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { username, pin, currentPin } = await request.json();
    const updateData = {};

    if (username !== undefined) {
      if (!username.trim()) {
        return NextResponse.json(
          { error: "Username cannot be empty" },
          { status: 400 },
        );
      }
      updateData.username = username.trim();
    }

    if (pin !== undefined) {
      if (!String(pin).trim()) {
        return NextResponse.json(
          { error: "PIN cannot be empty" },
          { status: 400 },
        );
      }
      if (!currentPin) {
        return NextResponse.json(
          { error: "Current PIN is required to set a new PIN" },
          { status: 400 },
        );
      }
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
      });
      const valid = await verifyPin(currentPin, user.pinHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Current PIN is incorrect" },
          { status: 403 },
        );
      }
      updateData.pinHash = await hashPin(pin);
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    if (username !== undefined) {
      session.username = updated.username;
      await session.save();
    }

    return NextResponse.json({ username: updated.username });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 },
      );
    }
    console.error("Update account error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
