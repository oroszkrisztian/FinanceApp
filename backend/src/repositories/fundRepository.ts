import { PrismaClient } from '@prisma/client';

export class FundRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getFundsByUserId(userId: number) {
    const funds = await this.prisma.fund.findMany({
      where: {
        userId,
      },
      include: {
        currency: true,
      },
    });
    return funds;
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}