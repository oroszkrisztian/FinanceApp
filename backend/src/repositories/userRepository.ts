import { PrismaClient } from "@prisma/client";
import { User, RegisterData } from "../types/user";

export interface EditUserData {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
}

export class UserRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async findByUsername(username: string) {
    return await this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findByUsernameOrEmail(username: string, email: string) {
    return await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });
  }

  async findById(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: RegisterData) {
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

  async editUser(userId: number, data: EditUserData) {
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

  async changePassword(userId: number, newPassword: string) {
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

  async checkAvailabilityForEdit(
    userId: number,
    username?: string,
    email?: string
  ) {
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
      usernameAvailable:
        !username || !conflictUser || conflictUser.username !== username,
      emailAvailable: !email || !conflictUser || conflictUser.email !== email,
    };
  }
}
