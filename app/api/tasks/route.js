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

  const tasks = await prisma.taskInstance.findMany({
    where: { shopId: session.shopId },
    include: { assignedAssociate: true, template: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(tasks)
}

export async function POST(request) {
  const session = await getAuthSession(request)
  if (!session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, scheduledTime, recurrenceRule, assignedAssociateId, saveAsTemplate } =
      await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Task name is required' }, { status: 400 })
    }

    if (saveAsTemplate) {
      const template = await prisma.taskTemplate.create({
        data: { name, shopId: session.shopId, recurrenceRule: recurrenceRule || null },
      })

      const task = await prisma.taskInstance.create({
        data: {
          name,
          shopId: session.shopId,
          templateId: template.id,
          scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
          assignedAssociateId: assignedAssociateId || null,
          status: 'PENDING',
        },
        include: { assignedAssociate: true, template: true },
      })

      return NextResponse.json(task, { status: 201 })
    } else {
      const task = await prisma.taskInstance.create({
        data: {
          name,
          shopId: session.shopId,
          scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
          assignedAssociateId: assignedAssociateId || null,
          status: 'PENDING',
        },
        include: { assignedAssociate: true, template: true },
      })

      return NextResponse.json(task, { status: 201 })
    }
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
