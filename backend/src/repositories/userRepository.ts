import { PrismaClient } from "@prisma/client";
import { User, RegisterData } from "../types/user";

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

  async create(data: RegisterData) {
    return await this.prisma.$transaction(async (prisma) => {
      // Create  user
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
}