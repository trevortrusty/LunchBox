import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session'
import prisma from '@/lib/db/prisma'

async function getAuthSession(request) {
  const response = NextResponse.next()
  return getIronSession(request, response, sessionOptions)
}

export async function PATCH(request, { params }) {
  const session = await getAuthSession(request)
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const shift = await prisma.shift.findUnique({ where: { id } })
    if (!shift || shift.shopId !== session.shopId) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData = {}

    if (body.currentRole !== undefined) updateData.currentRole = body.currentRole
    if (body.status !== undefined) updateData.status = body.status

    const updated = await prisma.shift.update({
      where: { id },
      data: updateData,
      include: {
        associate: true,
        department: true,
        restPeriods: { orderBy: { scheduledTime: 'asc' } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update shift error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
