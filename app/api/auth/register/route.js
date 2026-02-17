import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/auth/session'
import { hashPin } from '@/lib/auth/password'
import prisma from '@/lib/db/prisma'

export async function POST(request) {
  try {
    const { username, pin, shopId, shopName, departmentId, departmentName } = await request.json()

    if (!username || !pin) {
      return NextResponse.json({ error: 'Username and PIN are required' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    let resolvedShopId = shopId
    let resolvedDepartmentId = departmentId

    if (shopName && !shopId) {
      const shop = await prisma.shop.create({ data: { name: shopName } })
      resolvedShopId = shop.id
    }

    if (!resolvedShopId) {
      return NextResponse.json({ error: 'Shop is required' }, { status: 400 })
    }

    if (departmentName && !departmentId) {
      const dept = await prisma.department.create({
        data: { name: departmentName, shopId: resolvedShopId },
      })
      resolvedDepartmentId = dept.id
    }

    const pinHash = await hashPin(pin)
    const user = await prisma.user.create({
      data: {
        username,
        pinHash,
        shopId: resolvedShopId,
        departmentId: resolvedDepartmentId,
      },
    })

    const response = NextResponse.json(
      { id: user.id, username: user.username, shopId: user.shopId, departmentId: user.departmentId },
      { status: 201 }
    )

    const session = await getIronSession(request, response, sessionOptions)
    session.userId = user.id
    session.shopId = user.shopId
    session.departmentId = user.departmentId
    session.username = user.username
    await session.save()

    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
