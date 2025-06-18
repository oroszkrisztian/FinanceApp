import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import "dotenv/config";
import { LoginCredentials, RegisterData, User } from "../types/user";
import { UserRepository } from "../repositories/userRepository";
import LoginEmailService from "./loginEmailService";

export class AuthService {
  private userRepository: UserRepository;
  private loginEmailService: LoginEmailService;
  private secret: Uint8Array;

  constructor() {
    this.userRepository = new UserRepository();
    this.loginEmailService = new LoginEmailService();
    this.secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "your-secret-key"
    );
  }

  async login(
    credentials: LoginCredentials,
    ipAddress?: string,
    userAgent?: string
  ) {
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

    const token = await this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;

    // Send login notification email
    try {
      await this.loginEmailService.sendLoginNotification({
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        loginTime: new Date(),
        ipAddress,
        userAgent,
      });
    } catch (error) {
      console.error("Failed to send login email:", error);
      // Continue with login even if email fails
    }

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

    const token = await this.generateToken(newUser);
    const { password: _, ...userWithoutPassword } = newUser;
    return {
      user: userWithoutPassword,
      token,
    };
  }

  async refreshToken(oldToken: string) {
    try {
      const { payload } = await jwtVerify(oldToken, this.secret);
      const user = await this.userRepository.findById(payload.userId as number);

      if (!user) {
        throw new Error("User not found");
      }

      const newToken = await this.generateToken(user);
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token: newToken,
      };
    } catch (error) {
      throw new Error("Invalid token");
    }
  }

  private async generateToken(user: User) {
    const token = await new SignJWT({
      userId: user.id,
      username: user.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("24h")
      .sign(this.secret);

    return token;
  }
}
