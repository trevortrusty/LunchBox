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

  const roles = await prisma.role.findMany({
    where: { shopId: session.shopId },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(roles)
}

export async function POST(request) {
  const session = await getAuthSession(request)
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await request.json()
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const role = await prisma.role.create({
      data: { name, shopId: session.shopId },
    })

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error('Create role error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
