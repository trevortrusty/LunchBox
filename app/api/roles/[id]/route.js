import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session'
import prisma from '@/lib/db/prisma'

async function getAuthSession(request) {
  const response = NextResponse.next()
  return getIronSession(request, response, sessionOptions)
}

export async function DELETE(request, { params }) {
  const session = await getAuthSession(request)
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const role = await prisma.role.findUnique({ where: { id } })
  if (!role || role.shopId !== session.shopId) {
    return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  }

  await prisma.role.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
