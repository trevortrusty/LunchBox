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
    const task = await prisma.taskInstance.findUnique({ where: { id } })
    if (!task || task.shopId !== session.shopId) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData = {}

    if (body.status !== undefined) updateData.status = body.status
    if (body.assignedAssociateId !== undefined)
      updateData.assignedAssociateId = body.assignedAssociateId

    const updated = await prisma.taskInstance.update({
      where: { id },
      data: updateData,
      include: { assignedAssociate: true, template: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
