import { PrismaClient } from "@prisma/client";
import { all } from "axios";

export class CategoriesRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getAllSystemCategories() {
    return await this.prisma.customCategory.findMany({
      where: {
        type: "SYSTEM",
      },
    });
  }

  async createUserCategory(userId: number, categoryName: string) {
    return await this.prisma.customCategory.create({
      data: {
        userId,
        name: categoryName,
        type: "USER",
      },
    });
  }

  async getUserCategories(userId: number) {
    return await this.prisma.customCategory.findMany({
      where: {
        userId,
        type: "USER",
        deletedAt: null,
      },
    });
  }

  async getAllCategoriesForUser(userId: number) {
    const allcat = await this.prisma.customCategory.findMany({
      where: {
        OR: [{ type: "SYSTEM" }, { userId, type: "USER" }],
        deletedAt: null,
      },
    });
    console.log(allcat)
    return allcat;
  }

  async updateUserCategory(
    categoryId: number,
    userId: number,
    newName: string
  ) {
    return await this.prisma.customCategory.update({
      where: {
        id: categoryId,
        userId,
        type: "USER",
      },
      data: {
        name: newName,
      },
    });
  }

  async softDeleteUserCategory(categoryId: number, userId: number) {
    return await this.prisma.customCategory.update({
      where: {
        id: categoryId,
        userId,
        type: "USER",
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
