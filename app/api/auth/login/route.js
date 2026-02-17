import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session'
import { verifyPin } from '@/lib/auth/password'
import prisma from '@/lib/db/prisma'

export async function POST(request) {
  try {
    const { username, pin } = await request.json()

    if (!username || !pin) {
      return NextResponse.json({ error: 'Username and PIN are required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { shop: true, department: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await verifyPin(pin, user.pinHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const response = NextResponse.json({
      id: user.id,
      username: user.username,
      shopId: user.shopId,
      departmentId: user.departmentId,
    })

    const session = await getIronSession(request, response, sessionOptions)
    session.userId = user.id
    session.shopId = user.shopId
    session.departmentId = user.departmentId
    session.username = user.username
    await session.save()

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
