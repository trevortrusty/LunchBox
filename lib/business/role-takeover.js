export class RoleSwapError extends Error {
  constructor(message) {
    super(message);
    this.name = "RoleSwapError";
  }
}

/**
 * Send an associate to their rest period, optionally with a relief associate.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ restPeriodId: string, reliefAssociateId?: string, noRelief?: boolean }} options
 */
export async function executeRoleSwap(
  prisma,
  { restPeriodId, reliefAssociateId, noRelief },
) {
  const restPeriod = await prisma.restPeriod.findUnique({
    where: { id: restPeriodId },
    include: {
      shift: {
        include: { associate: true },
      },
    },
  });

  if (!restPeriod) throw new RoleSwapError("Rest period not found");
  if (restPeriod.status === "OUT")
    throw new RoleSwapError("Associate is already out");
  if (restPeriod.status === "COMPLETED")
    throw new RoleSwapError("Rest period already completed");

  const departingShift = restPeriod.shift;

  if (noRelief) {
    return prisma.restPeriod.update({
      where: { id: restPeriodId },
      data: {
        status: "OUT",
        actualStartTime: new Date(),
      },
      include: { shift: { include: { restPeriods: true, associate: true } } },
    });
  }

  // Validate relief associate
  const reliefAssociate = await prisma.associate.findUnique({
    where: { id: reliefAssociateId },
    include: {
      shifts: {
        where: { status: "ACTIVE" },
        take: 1,
      },
    },
  });

  if (!reliefAssociate) throw new RoleSwapError("Relief associate not found");

  const reliefShift = reliefAssociate.shifts[0];
  if (!reliefShift)
    throw new RoleSwapError("Relief associate does not have an active shift");

  // Check relief associate is not already out on break
  const reliefActiveRest = await prisma.restPeriod.findFirst({
    where: { shiftId: reliefShift.id, status: "OUT" },
  });
  if (reliefActiveRest)
    throw new RoleSwapError("Relief associate is currently on break");

  // Check relief associate is not already covering another shift
  const reliefShiftFull = await prisma.shift.findUnique({
    where: { id: reliefShift.id },
  });
  if (reliefShiftFull.temporarilyCoveringShiftId) {
    throw new RoleSwapError(
      "Relief associate is already covering another shift",
    );
  }

  // No relief chains: departing shift should not itself be covering someone
  if (departingShift.temporarilyCoveringShiftId) {
    throw new RoleSwapError(
      "Cannot create relief chains: departing associate is already covering another shift",
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.restPeriod.update({
      where: { id: restPeriodId },
      data: {
        status: "OUT",
        actualStartTime: new Date(),
        relievedByAssociateId: reliefAssociateId,
      },
    });

    await tx.shift.update({
      where: { id: reliefShift.id },
      data: {
        currentRole: departingShift.currentRole,
        temporarilyCoveringShiftId: departingShift.id,
      },
    });

    return tx.restPeriod.findUnique({
      where: { id: restPeriodId },
      include: {
        shift: {
          include: {
            restPeriods: true,
            associate: true,
          },
        },
        relievedByAssociate: true,
      },
    });
  });
}

/**
 * Return an associate from their rest period.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ restPeriodId: string }} options
 */
export async function executeReturn(prisma, { restPeriodId }) {
  const restPeriod = await prisma.restPeriod.findUnique({
    where: { id: restPeriodId },
    include: {
      relievedByAssociate: {
        include: {
          shifts: {
            where: { temporarilyCoveringShiftId: { not: null } },
            take: 1,
          },
        },
      },
    },
  });

  if (!restPeriod) throw new RoleSwapError("Rest period not found");
  if (restPeriod.status !== "OUT")
    throw new RoleSwapError("Associate is not currently out");

  return prisma.$transaction(async (tx) => {
    await tx.restPeriod.update({
      where: { id: restPeriodId },
      data: {
        status: "COMPLETED",
        actualEndTime: new Date(),
      },
    });

    if (restPeriod.relievedByAssociateId) {
      const reliefShift = restPeriod.relievedByAssociate.shifts[0];
      if (reliefShift) {
        await tx.shift.update({
          where: { id: reliefShift.id },
          data: {
            currentRole: reliefShift.originalRole,
            temporarilyCoveringShiftId: null,
          },
        });
      }
    }

    return tx.restPeriod.findUnique({
      where: { id: restPeriodId },
      include: {
        shift: {
          include: {
            restPeriods: true,
            associate: true,
          },
        },
        relievedByAssociate: true,
      },
    });
  });
}

/**
 * Reset an associate's rest period.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @param {{ restPeriodId: string }} options
 */
export async function executeReset(prisma, { restPeriodId }) {
  const restPeriod = await prisma.restPeriod.findUnique({
    where: { id: restPeriodId },
    include: {
      shift: {
        include: { associate: true },
      },
    },
  });

  if (!restPeriod) throw new RoleSwapError("Rest period not found");

  return prisma.restPeriod.update({
    where: { id: restPeriodId },
    data: {
      status: "SCHEDULED",
      actualStartTime: new Date(),
    },
    include: { shift: { include: { restPeriods: true, associate: true } } },
  });
}
