import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session'
import prisma from '@/lib/db/prisma'

export async function GET(request) {
  const response = NextResponse.next()
  const session = await getIronSession(request, response, sessionOptions)

  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000)

  const scheduledRests = await prisma.restPeriod.findMany({
    where: {
      shift: { shopId: session.shopId },
      status: 'SCHEDULED',
    },
    select: { scheduledTime: true },
  })

  let dueNow = 0
  let dueSoon = 0

  for (const rest of scheduledRests) {
    if (new Date(rest.scheduledTime) <= now) {
      dueNow++
    } else if (new Date(rest.scheduledTime) <= thirtyMinutesFromNow) {
      dueSoon++
    }
  }

  return NextResponse.json({ dueSoon, dueNow })
}
