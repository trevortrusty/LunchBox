import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { generateRestSchedule } from "@/lib/business/rest-scheduler";

async function getAuthSession(request) {
  const response = NextResponse.next();
  const session = await getIronSession(request, response, sessionOptions);
  return session;
}

export async function GET(request) {
  const session = await getAuthSession(request);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get("date");

  let dateFilter = {};
  if (dateParam) {
    // Parse as local date. new Date('YYYY-MM-DD') parses as UTC midnight which is the
    // previous day in negative-offset timezones (e.g. EST). Using year/month/day
    // components forces local-timezone interpretation.
    const [year, month, day] = dateParam.split("-").map(Number);
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end = new Date(year, month - 1, day, 23, 59, 59, 999);
    dateFilter = {
      startTime: { gte: start, lte: end },
    };
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateFilter = {
      startTime: { gte: today, lt: tomorrow },
    };
  }

  const shifts = await prisma.shift.findMany({
    where: { shopId: session.shopId, ...dateFilter },
    include: {
      associate: true,
      department: true,
      restPeriods: { orderBy: { scheduledTime: "asc" } },
      coveringShift: { include: { associate: true } },
      coveredByShift: { include: { associate: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(shifts);
}

export async function POST(request) {
  const session = await getAuthSession(request);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { associateId, departmentId, startTime, endTime, role } =
      await request.json();

    if (!associateId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "associateId, startTime, and endTime are required" },
        { status: 400 },
      );
    }

    // Verify associate belongs to same shop
    const associate = await prisma.associate.findUnique({
      where: { id: associateId },
    });
    if (!associate || associate.shopId !== session.shopId) {
      return NextResponse.json(
        { error: "Associate not found" },
        { status: 404 },
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const restSchedule = generateRestSchedule(start, end);

    const shift = await prisma.$transaction(async (tx) => {
      const newShift = await tx.shift.create({
        data: {
          shopId: session.shopId,
          associateId,
          departmentId: departmentId || associate.departmentId,
          startTime: start,
          endTime: end,
          status: "ACTIVE",
          originalRole: role || null,
          currentRole: role || null,
        },
      });

      if (restSchedule.length > 0) {
        await tx.restPeriod.createMany({
          data: restSchedule.map((r) => ({
            shiftId: newShift.id,
            type: r.type,
            scheduledTime: r.scheduledTime,
            status: "SCHEDULED",
          })),
        });
      }

      return tx.shift.findUnique({
        where: { id: newShift.id },
        include: {
          associate: true,
          department: true,
          restPeriods: { orderBy: { scheduledTime: "asc" } },
        },
      });
    });

    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    console.error("Create shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
