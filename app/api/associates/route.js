import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session'
import prisma from '@/lib/db/prisma'

async function getAuthSession(request) {
  const response = NextResponse.next()
  return getIronSession(request, response, sessionOptions)
}

export async function GET(request) {
  const session = await getAuthSession(request)
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const associates = await prisma.associate.findMany({
    where: { shopId: session.shopId },
    include: { department: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(associates)
}

export async function POST(request) {
  const session = await getAuthSession(request)
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, departmentId } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const associate = await prisma.associate.create({
      data: { name, shopId: session.shopId, departmentId: departmentId || null },
      include: { department: true },
    })

    return NextResponse.json(associate, { status: 201 })
  } catch (error) {
    console.error('Create associate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
