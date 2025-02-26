import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

import { LoginCredentials, RegisterData, User } from "../types/user";
import { UserRepository } from "../repositories/userRepository";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(credentials: LoginCredentials) {
    const user = await this.userRepository.findByUsername(credentials.username);

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const isValidPassword = await bcrypt.compare(
      credentials.password,
      user.password
    );

    if (!isValidPassword) {
      throw new Error("Invalid username or password");
    }

    const token = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  async register(data: RegisterData) {
    if (
      !data.firstName ||
      !data.lastName ||
      !data.username ||
      !data.email ||
      !data.password 
    ) {
      throw new Error("All fields are required");
    }

    const existingUser = await this.userRepository.findByUsernameOrEmail(
      data.username,
      data.email
    );

    if (existingUser) {
      if (existingUser.username === data.username) {
        throw new Error("Username is already taken");
      }
      if (existingUser.email === data.email) {
        throw new Error("Email is already registered");
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    const token = this.generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      user: userWithoutPassword,
      token,
    };
  }

  private generateToken(user: User) {
    return sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );
  }
}
