import { PrismaClient, TransactionType } from "@prisma/client";

export class TransactionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async addFundsDefaultAccount(
    userId: number,
    name: string,
    description: string,
    amount: number,
    type: TransactionType,
    toAccountId: number,
    customCategoryId: number | null
  ) {
    const defaultAccount = await this.prisma.account.findFirst({
      where: {
        id: toAccountId,
        userId: userId,
        isDefault: true,
        deletedAt: null,
      },
    });

    if (!defaultAccount) {
      throw new Error("No default account found for the user");
    }

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          userId: userId,
          name: name,
          description: description,
          amount: amount,
          type: type,
          toAccountId: defaultAccount.id,
          customCategoryId: customCategoryId,
        },
        include: {
          toAccount: true,
          customCategory: true,
        },
      });

      await prisma.account.update({
        where: {
          id: defaultAccount.id,
        },
        data: {
          amount: {
            increment: amount,
          },
        },
      });

      return transaction;
    });
  }
}
