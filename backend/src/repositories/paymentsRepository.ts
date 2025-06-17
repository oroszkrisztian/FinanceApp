import {
  CurrencyType,
  Frequency,
  PaymentType,
  PrismaClient,
} from "@prisma/client";

export class PaymentsRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createPayment(
    userId: number, 
    name: string,
    amount: number,
    description: string | null,
    accountId: number,
    startDate: Date,
    frequency: Frequency,
    emailNotification: boolean,
    notificationDay: number,
    automaticPayment: boolean,
    type: PaymentType,
    currency: CurrencyType,
    categoriesId: number[] | null,
    paymentId?: number 
  ) {
    return await this.prisma.$transaction(async (tx) => {
      if (paymentId) {

        await tx.recurringBillCategory.deleteMany({
          where: {
            recurringFundAndBillId: paymentId,
          },
        });

        const updatedPayment = await tx.recurringFundAndBill.update({
          where: {
            id: paymentId,
            user: {
              some: {
                id: userId,
              },
            },
          },
          data: {
            name: name,
            amount: amount,
            description: description,
            accountId: accountId,
            frequency: frequency,
            emailNotification: emailNotification,
            notificationDay: notificationDay || 0,
            automaticAddition: automaticPayment,
            nextExecution: startDate,
            type: type,
            currency: currency,
            ...(categoriesId &&
              categoriesId.length > 0 && {
                categories: {
                  create: categoriesId.map((categoryId) => ({
                    customCategoryId: categoryId,
                  })),
                },
              }),
          },
          include: {
            account: true,
            user: true,
            categories: {
              include: {
                customCategory: true,
              },
            },
          },
        });

        return updatedPayment;
      } else {
        const payment = await tx.recurringFundAndBill.create({
          data: {
            name: name,
            amount: amount,
            description: description,
            accountId: accountId,
            frequency: frequency,
            emailNotification: emailNotification,
            notificationDay: notificationDay || 0,
            automaticAddition: automaticPayment,
            nextExecution: startDate,
            type: type,
            currency: currency,
            user: {
              connect: { id: userId },
            },
            ...(categoriesId &&
              categoriesId.length > 0 && {
                categories: {
                  create: categoriesId.map((categoryId) => ({
                    customCategoryId: categoryId,
                  })),
                },
              }),
          },
          include: {
            account: true,
            user: true,
            categories: {
              include: {
                customCategory: true,
              },
            },
          },
        });

        return payment;
      }
    });
  }

  async getAllPayments(userId: number) {
    const payments = await this.prisma.recurringFundAndBill.findMany({
      where: {
        user: {
          some: {
            id: userId,
          },
        },
        deletedAt: null,
      },
      include: {
        account: true,
        user: true,
        categories: {
          include: {
            customCategory: true,
          },
          where: {
            deletedAt: null,
          },
        },
      },
      orderBy: {
        nextExecution: "asc",
      },
    });

    return payments;
  }

  async deletePayment(userId: number, paymentId: number) {
    return await this.prisma.$transaction(async (tx) => {
      await tx.recurringBillCategory.deleteMany({
        where: {
          recurringFundAndBillId: paymentId,
        },
      });
      const deletedPayment = await tx.recurringFundAndBill.update({
        where: {
          id: paymentId,
          user: {
            some: {
              id: userId,
            },
          },
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return deletedPayment;
    });
  }
}
