"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = require("jsonwebtoken");
require("dotenv/config");
const userRepository_1 = require("../repositories/userRepository");
class AuthService {
    userRepository;
    constructor() {
        this.userRepository = new userRepository_1.UserRepository();
    }
    async login(credentials) {
        const user = await this.userRepository.findByUsername(credentials.username);
        if (!user) {
            throw new Error("Invalid username or password");
        }
        const isValidPassword = await bcryptjs_1.default.compare(credentials.password, user.password);
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
    async register(data) {
        if (!data.firstName ||
            !data.lastName ||
            !data.username ||
            !data.email ||
            !data.password) {
            throw new Error("All fields are required");
        }
        const existingUser = await this.userRepository.findByUsernameOrEmail(data.username, data.email);
        if (existingUser) {
            if (existingUser.username === data.username) {
                throw new Error("Username is already taken");
            }
            if (existingUser.email === data.email) {
                throw new Error("Email is already registered");
            }
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 10);
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
    async refreshToken(oldToken) {
        try {
            const decoded = (0, jsonwebtoken_1.verify)(oldToken, process.env.JWT_SECRET || "your-secret-key");
            const user = await this.userRepository.findById(decoded.userId);
            if (!user) {
                throw new Error("User not found");
            }
            const newToken = this.generateToken(user);
            const { password: _, ...userWithoutPassword } = user;
            return {
                user: userWithoutPassword,
                token: newToken,
            };
        }
        catch (error) {
            throw new Error("Invalid token");
        }
    }
    generateToken(user) {
        return (0, jsonwebtoken_1.sign)({ userId: user.id, username: user.username }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "24h" });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map