import { PrismaClient } from "@prisma/client";
import { get } from "http";


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