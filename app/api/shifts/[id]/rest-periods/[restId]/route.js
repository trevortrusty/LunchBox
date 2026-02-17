import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import {
  executeRoleSwap,
  executeReturn,
  executeReset,
  RoleSwapError,
} from "@/lib/business/role-takeover";

async function getAuthSession(request) {
  const response = NextResponse.next();
  return getIronSession(request, response, sessionOptions);
}

export async function PATCH(request, { params }) {
  const session = await getAuthSession(request);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, restId } = await params;

  try {
    // Verify shift belongs to session shop
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift || shift.shopId !== session.shopId) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action, reliefAssociateId, noRelief } = body;

    if (action === "SEND") {
      const result = await executeRoleSwap(prisma, {
        restPeriodId: restId,
        reliefAssociateId,
        noRelief,
      });
      return NextResponse.json(result);
    } else if (action === "RETURN") {
      const result = await executeReturn(prisma, { restPeriodId: restId });
      return NextResponse.json(result);
    } else if (action === "RESET") {
      const result = await executeReset(prisma, { restPeriodId: restId });
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use SEND or RETURN" },
        { status: 400 },
      );
    }
  } catch (error) {
    if (error instanceof RoleSwapError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Rest period update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
