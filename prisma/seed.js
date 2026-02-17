import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { generateRestSchedule } from '../lib/business/rest-scheduler.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding database...')

  // Create a shop
  const shop = await prisma.shop.upsert({
    where: { id: 'seed-shop-1' },
    update: {},
    create: {
      id: 'seed-shop-1',
      name: 'Main Street Market',
    },
  })
  console.log('Shop:', shop.name)

  // Create departments
  const frontEnd = await prisma.department.upsert({
    where: { name_shopId: { name: 'Front End', shopId: shop.id } },
    update: {},
    create: { name: 'Front End', shopId: shop.id },
  })
  const grocery = await prisma.department.upsert({
    where: { name_shopId: { name: 'Grocery', shopId: shop.id } },
    update: {},
    create: { name: 'Grocery', shopId: shop.id },
  })
  console.log('Departments:', frontEnd.name, grocery.name)

  // Create roles
  const roleNames = ['Cashier', 'Customer Service', 'Floor Lead', 'Supervisor', 'Stock']
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name_shopId: { name, shopId: shop.id } },
      update: {},
      create: { name, shopId: shop.id },
    })
  }
  console.log('Roles created:', roleNames.join(', '))

  // Create associates
  const associateData = [
    { name: 'Alice Johnson', deptId: frontEnd.id },
    { name: 'Bob Smith', deptId: frontEnd.id },
    { name: 'Carol Davis', deptId: grocery.id },
    { name: 'David Wilson', deptId: grocery.id },
    { name: 'Eva Martinez', deptId: frontEnd.id },
  ]
  const associates = []
  for (const a of associateData) {
    const associate = await prisma.associate.create({
      data: { name: a.name, shopId: shop.id, departmentId: a.deptId },
    })
    associates.push(associate)
    console.log('Associate:', associate.name)
  }

  // Create a supervisor user
  const pinHash = await bcrypt.hash('1234', 12)
  const user = await prisma.user.upsert({
    where: { username: 'supervisor' },
    update: {},
    create: {
      username: 'supervisor',
      pinHash,
      shopId: shop.id,
      departmentId: frontEnd.id,
    },
  })
  console.log('User created:', user.username, '(PIN: 1234)')

  // Create shifts for today
  const today = new Date()
  today.setHours(9, 0, 0, 0)

  for (let i = 0; i < 3; i++) {
    const start = new Date(today)
    const end = new Date(today)
    end.setHours(17, 0, 0, 0)

    const restSchedule = generateRestSchedule(start, end)

    const shift = await prisma.shift.create({
      data: {
        shopId: shop.id,
        associateId: associates[i].id,
        departmentId: associates[i].departmentId,
        startTime: start,
        endTime: end,
        status: 'ACTIVE',
        originalRole: roleNames[i],
        currentRole: roleNames[i],
        restPeriods: {
          create: restSchedule.map((r) => ({
            type: r.type,
            scheduledTime: r.scheduledTime,
            status: 'SCHEDULED',
          })),
        },
      },
      include: { restPeriods: true },
    })
    console.log(
      `Shift: ${associates[i].name} ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()} (${shift.restPeriods.length} rests)`
    )
  }

  // Create some tasks
  const taskNames = ['Restock checkout lanes', 'Clean break room', 'Price check aisle 5']
  for (const name of taskNames) {
    await prisma.taskInstance.create({
      data: { name, shopId: shop.id, status: 'PENDING' },
    })
  }
  console.log('Tasks created:', taskNames.length)

  console.log('\nSeed complete!')
  console.log('Login with: username=supervisor, PIN=1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
