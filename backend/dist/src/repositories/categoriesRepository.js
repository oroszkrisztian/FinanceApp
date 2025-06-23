"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesRepository = void 0;
const client_1 = require("@prisma/client");
class CategoriesRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async getAllSystemCategories() {
        return await this.prisma.customCategory.findMany({
            where: {
                type: "SYSTEM",
            },
        });
    }
    async createUserCategory(userId, categoryName) {
        return await this.prisma.customCategory.create({
            data: {
                userId,
                name: categoryName,
                type: "USER",
            },
        });
    }
    async getUserCategories(userId) {
        return await this.prisma.customCategory.findMany({
            where: {
                userId,
                type: "USER",
                deletedAt: null,
            },
        });
    }
    async getAllCategoriesForUser(userId) {
        const allcat = await this.prisma.customCategory.findMany({
            where: {
                OR: [{ type: "SYSTEM" }, { userId, type: "USER" }],
                deletedAt: null,
            },
        });
        return allcat;
    }
    async updateUserCategory(categoryId, userId, newName) {
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
    async softDeleteUserCategory(categoryId, userId) {
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
exports.CategoriesRepository = CategoriesRepository;
//# sourceMappingURL=categoriesRepository.js.map