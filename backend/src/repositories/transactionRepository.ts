import { CurrencyType, PrismaClient, TransactionType } from "@prisma/client";

export class TransactionRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getUserAllTransactions(userId: number) {
    const allTransactions = await this.prisma.transaction.findMany({
      where: {
        userId: userId,
      },
    });
    console.log("Repository layer transactions:", allTransactions);
    return allTransactions;
  }

  async addFundsDefaultAccount(
    userId: number,
    name: string | null,
    description: string,
    amount: number,
    type: TransactionType,
    toAccountId: number,
    customCategoryId: number | null,
    currency: CurrencyType
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
          currency: currency,
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

  async addFundsSaving(
    userId: number,
    amount: number,
    fromAccountId: number,
    toSavingId: number,
    type: TransactionType,
    currency: CurrencyType
  ) {
    const fromAccount = await this.prisma.account.findFirst({
      where: {
        id: fromAccountId,
        userId,
        deletedAt: null,
      },
    });

    if (!fromAccount) {
      throw new Error("Source account not found or doesn't belong to the user");
    }

    const toAccount = await this.prisma.account.findFirst({
      where: {
        id: toSavingId,
        userId,
        type: "SAVINGS",
        deletedAt: null,
      },
      include: {
        savingAccount: true,
      },
    });

    if (!toAccount) {
      throw new Error(
        "Savings account not found or doesn't belong to the user"
      );
    }

    if (fromAccount.amount < amount) {
      throw new Error("Insufficient funds in the source account");
    }

    return await this.prisma.$transaction(async (prisma) => {
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          amount,
          type,
          fromAccountId: fromAccountId,
          toAccountId: toSavingId,
          currency,
        },
        include: {
          fromAccount: true,
          toAccount: true,
          customCategory: true,
        },
      });

      await prisma.account.update({
        where: {
          id: fromAccountId,
        },
        data: {
          amount: {
            decrement: amount,
          },
        },
      });

      await prisma.account.update({
        where: {
          id: toSavingId,
        },
        data: {
          amount: {
            increment: amount,
          },
        },
      });

      if (toAccount.savingAccount && !toAccount.savingAccount.isCompleted) {
        const updatedAmount = toAccount.amount + amount;

        if (updatedAmount >= toAccount.savingAccount.targetAmount) {
          await prisma.savingAccount.update({
            where: {
              id: toAccount.savingAccount.id,
            },
            data: {
              isCompleted: true,
            },
          });
        }
      }

      return transaction;
    });
  }
}
