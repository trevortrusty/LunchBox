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
  const associate = await prisma.associate.findUnique({ where: { id } })
  if (!associate || associate.shopId !== session.shopId) {
    return NextResponse.json({ error: 'Associate not found' }, { status: 404 })
  }

  try {
    const { name, departmentId } = await request.json()
    const updated = await prisma.associate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
      },
      include: { department: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update associate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await getAuthSession(request)
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const associate = await prisma.associate.findUnique({ where: { id } })
  if (!associate || associate.shopId !== session.shopId) {
    return NextResponse.json({ error: 'Associate not found' }, { status: 404 })
  }

  await prisma.associate.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
