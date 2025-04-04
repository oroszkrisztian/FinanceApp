import { PrismaClient } from "@prisma/client";



export class CategoriesRepository {
    private prisma : PrismaClient
    constructor() {
        this.prisma = new PrismaClient();
    }

    async getAllSystemCategories() {
        return await this.prisma.customCategory.findMany({
            where: {
                type: "SYSTEM"
            }
        })
    }
}