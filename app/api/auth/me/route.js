import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session'

export async function GET(request) {
  const response = NextResponse.next()
  const session = await getIronSession(request, response, sessionOptions)

  if (!session.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  return NextResponse.json({
    userId: session.userId,
    shopId: session.shopId,
    departmentId: session.departmentId,
    username: session.username,
  })
}
