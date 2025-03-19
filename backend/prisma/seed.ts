import { PrismaClient, CategoryType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSystemCategories() {
  const systemCategories = [
    { name: 'Food & Dining' },
    { name: 'Groceries' },
    { name: 'Transportation' },
    { name: 'Entertainment' },
    { name: 'Housing' },
    { name: 'Utilities' },
    { name: 'Healthcare' },
    { name: 'Education' },
    { name: 'Shopping' },
    { name: 'Personal Care' },
    { name: 'Travel' },
    { name: 'Fitness' },
    { name: 'Gifts & Donations' },
    { name: 'Investments' },
    { name: 'Savings' },
    { name: 'Salary' },
    { name: 'Income' },
    { name: 'Taxes' },
  ];

  console.log('Starting to seed system categories...');
  
  try {
    // Check for existing system categories and create missing ones
    for (const category of systemCategories) {
      const existingCategory = await prisma.customCategory.findFirst({
        where: { 
          name: category.name,
          type: CategoryType.SYSTEM
        }
      });

      if (!existingCategory) {
        // Create the system category without userId
        await prisma.customCategory.create({
          data: {
            name: category.name,
            type: CategoryType.SYSTEM
            // No userId is needed now
          }
        });
        console.log(`Added system category: ${category.name}`);
      } else {
        console.log(`System category ${category.name} already exists, skipping`);
      }
    }
    
    console.log('System categories seeding completed successfully');
  } catch (error) {
    console.error('Error seeding system categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the seeding function
seedSystemCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });