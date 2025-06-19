"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jose_1 = require("jose");
require("dotenv/config");
const userRepository_1 = require("../repositories/userRepository");
const loginEmailService_1 = __importDefault(require("./loginEmailService"));
const geoip_lite_1 = __importDefault(require("geoip-lite"));
class AuthService {
    userRepository;
    loginEmailService;
    secret;
    constructor() {
        this.userRepository = new userRepository_1.UserRepository();
        this.loginEmailService = new loginEmailService_1.default();
        this.secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");
    }
    async login(credentials, ipAddress, userAgent) {
        const user = await this.userRepository.findByUsername(credentials.username);
        if (!user) {
            throw new Error("Invalid username or password");
        }
        const isValidPassword = await bcryptjs_1.default.compare(credentials.password, user.password);
        if (!isValidPassword) {
            throw new Error("Invalid username or password");
        }
        const token = await this.generateToken(user);
        const { password: _, ...userWithoutPassword } = user;
        // Look up location from IP address
        let location = undefined;
        if (ipAddress && ipAddress !== "unknown") {
            const geo = geoip_lite_1.default.lookup(ipAddress.split(",")[0].trim());
            if (geo) {
                location = {
                    country: geo.country,
                    city: geo.city,
                };
            }
        }
        // Send login notification email
        try {
            await this.loginEmailService.sendLoginNotification({
                userEmail: user.email,
                userName: `${user.firstName} ${user.lastName}`,
                loginTime: new Date(),
                ipAddress,
                userAgent,
                location,
            });
        }
        catch (error) {
            console.error("Failed to send login email:", error);
            // Continue with login even if email fails
        }
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
        const token = await this.generateToken(newUser);
        const { password: _, ...userWithoutPassword } = newUser;
        return {
            user: userWithoutPassword,
            token,
        };
    }
    async refreshToken(oldToken) {
        try {
            const { payload } = await (0, jose_1.jwtVerify)(oldToken, this.secret);
            const user = await this.userRepository.findById(payload.userId);
            if (!user) {
                throw new Error("User not found");
            }
            const newToken = await this.generateToken(user);
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
    async generateToken(user) {
        const token = await new jose_1.SignJWT({
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
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map