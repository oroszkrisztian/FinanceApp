"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const client_1 = require("@prisma/client");
class UserRepository {
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    async findByUsername(username) {
        return await this.prisma.user.findUnique({
            where: { username },
        });
    }
    async findByUsernameOrEmail(username, email) {
        return await this.prisma.user.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });
    }
    async findById(id) {
        return await this.prisma.user.findUnique({
            where: { id },
        });
    }
    async create(data) {
        return await this.prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    username: data.username,
                    email: data.email,
                    password: data.password,
                },
            });
            return user;
        });
    }
    async editUser(userId, data) {
        return await this.prisma.$transaction(async (prisma) => {
            const existingUser = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!existingUser) {
                throw new Error("User not found");
            }
            if (data.username || data.email) {
                const conflictUser = await prisma.user.findFirst({
                    where: {
                        AND: [
                            { id: { not: userId } },
                            {
                                OR: [
                                    ...(data.username ? [{ username: data.username }] : []),
                                    ...(data.email ? [{ email: data.email }] : []),
                                ],
                            },
                        ],
                    },
                });
                if (conflictUser) {
                    if (conflictUser.username === data.username) {
                        throw new Error("Username already exists");
                    }
                    if (conflictUser.email === data.email) {
                        throw new Error("Email already exists");
                    }
                }
            }
            const updateData = {
                firstName: data.firstName ?? existingUser.firstName,
                lastName: data.lastName ?? existingUser.lastName,
                username: data.username ?? existingUser.username,
                email: data.email ?? existingUser.email,
                ...(data.password && { password: data.password }),
                updatedAt: new Date(),
            };
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                    email: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            return updatedUser;
        });
    }
    async changePassword(userId, newPassword) {
        return await this.prisma.$transaction(async (prisma) => {
            const user = await prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                throw new Error("User not found");
            }
            await prisma.user.update({
                where: { id: userId },
                data: {
                    password: newPassword,
                    updatedAt: new Date(),
                },
            });
            return { success: true, message: "Password updated successfully" };
        });
    }
    async checkAvailabilityForEdit(userId, username, email) {
        const conflictUser = await this.prisma.user.findFirst({
            where: {
                AND: [
                    { id: { not: userId } },
                    {
                        OR: [
                            ...(username ? [{ username }] : []),
                            ...(email ? [{ email }] : []),
                        ],
                    },
                ],
            },
        });
        return {
            usernameAvailable: !username || !conflictUser || conflictUser.username !== username,
            emailAvailable: !email || !conflictUser || conflictUser.email !== email,
        };
    }
}
exports.UserRepository = UserRepository;
//# sourceMappingURL=userRepository.js.map