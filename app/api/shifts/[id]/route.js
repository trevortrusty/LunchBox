import { NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { generateRestSchedule } from "@/lib/business/rest-scheduler";

async function getAuthSession(request) {
  const response = NextResponse.next();
  return getIronSession(request, response, sessionOptions);
}

export async function PATCH(request, { params }) {
  const session = await getAuthSession(request);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift || shift.shopId !== session.shopId) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData = {};

    if (body.currentRole !== undefined)
      updateData.currentRole = body.currentRole;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.originalRole !== undefined)
      updateData.originalRole = body.originalRole;

    if (body.associateId !== undefined) {
      const associate = await prisma.associate.findUnique({
        where: { id: body.associateId },
      });
      if (!associate || associate.shopId !== session.shopId) {
        return NextResponse.json(
          { error: "Associate not found" },
          { status: 404 },
        );
      }
      updateData.associateId = body.associateId;
      updateData.departmentId = associate.departmentId;
    }

    if (body.startTime !== undefined)
      updateData.startTime = new Date(body.startTime);
    if (body.endTime !== undefined) updateData.endTime = new Date(body.endTime);

    const timesChanged =
      body.startTime !== undefined || body.endTime !== undefined;

    let updated;
    if (timesChanged) {
      const newStart = updateData.startTime ?? shift.startTime;
      const newEnd = updateData.endTime ?? shift.endTime;
      const restSchedule = generateRestSchedule(newStart, newEnd);

      updated = await prisma.$transaction(async (tx) => {
        await tx.restPeriod.deleteMany({ where: { shiftId: id } });

        if (restSchedule.length > 0) {
          await tx.restPeriod.createMany({
            data: restSchedule.map((r) => ({
              shiftId: id,
              type: r.type,
              scheduledTime: r.scheduledTime,
              status: "SCHEDULED",
            })),
          });
        }

        return tx.shift.update({
          where: { id },
          data: updateData,
          include: {
            associate: true,
            department: true,
            restPeriods: { orderBy: { scheduledTime: "asc" } },
          },
        });
      });
    } else {
      updated = await prisma.shift.update({
        where: { id },
        data: updateData,
        include: {
          associate: true,
          department: true,
          restPeriods: { orderBy: { scheduledTime: "asc" } },
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const session = await getAuthSession(request);
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift || shift.shopId !== session.shopId) {
      return NextResponse.json({ error: "Shift not found" }, { status: 404 });
    }

    // Delete related rest periods first, then delete the shift
    await prisma.restPeriod.deleteMany({
      where: { shiftId: id },
    });

    const deleted = await prisma.shift.delete({
      where: { id },
    });

    return NextResponse.json(deleted);
  } catch (error) {
    console.error("Delete shift error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
