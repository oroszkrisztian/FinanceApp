import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Create a test currency
    const currency = await prisma.currency.create({
      data: {
        name: 'USD'
      }
    })
    console.log('✅ Test currency created:', currency)

    // Create a test transaction type
    const transactionType = await prisma.transactionType.create({
      data: {
        name: 'Transfer',
        in_or_out: true
      }
    })
    console.log('✅ Test transaction type created:', transactionType)

    // Create a test user
    const hashedPassword = await bcrypt.hash('testpassword123', 10)
    const user = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        accounts: {
          create: {
            name: 'Main Account',
            currencyId: currency.id
          }
        }
      },
      include: {
        accounts: true
      }
    })
    console.log('✅ Test user created with account:', user)

    // Test queries
    const userCount = await prisma.user.count()
    console.log(`📊 Total users: ${userCount}`)

    const allCurrencies = await prisma.currency.findMany()
    console.log('📊 All currencies:', allCurrencies)

  } catch (error) {
    console.error('❌ Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the test
testDatabase()