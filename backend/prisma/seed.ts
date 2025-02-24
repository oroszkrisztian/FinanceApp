import { PrismaClient } from '@prisma/client'
import 'dotenv/config';

const prisma = new PrismaClient()

async function main() {
  console.log('Deleting all existing currencies...')

  await prisma.currency.deleteMany() // Deletes all rows

  console.log('All currencies deleted. Seeding new currencies...')

  const currencies = [
    { name: 'HUF' }, // Hungarian Forint
    { name: 'RON' }, // Romanian Leu
    { name: 'USD' }, // US Dollar
    { name: 'EUR' }, // Euro
    { name: 'GBP' }, // British Pound
    { name: 'JPY' }, // Japanese Yen
    { name: 'AUD' }, // Australian Dollar
    { name: 'CAD' }, // Canadian Dollar
    { name: 'CHF' }, // Swiss Franc
    { name: 'CNY' }, // Chinese Yuan
    { name: 'INR' }, // Indian Rupee
    { name: 'NZD' }  // New Zealand Dollar
  ]

  for (const currency of currencies) {
    const created = await prisma.currency.create({
      data: currency
    })
    console.log(`Created currency: ${created.name} with id: ${created.id}`)
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
