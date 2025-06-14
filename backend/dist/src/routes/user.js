"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hono_1 = require("hono");
const userRepository_1 = require("../repositories/userRepository");
const auth_1 = require("../middleware/auth");
const bcrypt_1 = __importDefault(require("bcrypt"));
const users = new hono_1.Hono();
const userRepository = new userRepository_1.UserRepository();
users.use("*", auth_1.verifyToken);
users.post("/getUser", async (c) => {
    try {
        const userId = c.get("userId");
        const user = await userRepository.findById(userId);
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }
        const { password, ...userWithoutPassword } = user;
        return c.json({ user: userWithoutPassword }, 200);
    }
    catch (error) {
        console.error("Error in /getUser route:", error);
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
});
users.post("/editUser", async (c) => {
    try {
        const userId = c.get("userId");
        const body = await c.req.json();
        const { firstName, lastName, username, email, password } = body;
        if (!firstName || !lastName || !username) {
            return c.json({
                error: "Missing required fields (firstName, lastName, username)",
            }, 400);
        }
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return c.json({ error: "Invalid email format" }, 400);
        }
        let hashedPassword;
        if (password) {
            if (password.length < 6) {
                return c.json({ error: "Password must be at least 6 characters long" }, 400);
            }
            hashedPassword = await bcrypt_1.default.hash(password, 10);
        }
        const editData = {
            firstName,
            lastName,
            username,
            email,
            ...(hashedPassword && { password: hashedPassword }),
        };
        const updatedUser = await userRepository.editUser(userId, editData);
        return c.json({
            user: updatedUser,
            message: "User updated successfully"
        }, 200);
    }
    catch (error) {
        console.error("Error in /editUser route:", error);
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
});
users.post("/changePassword", async (c) => {
    try {
        const userId = c.get("userId");
        const body = await c.req.json();
        const { currentPassword, newPassword } = body;
        if (!currentPassword || !newPassword) {
            return c.json({
                error: "Missing required fields (currentPassword, newPassword)",
            }, 400);
        }
        if (newPassword.length < 6) {
            return c.json({ error: "New password must be at least 6 characters long" }, 400);
        }
        const user = await userRepository.findById(userId);
        if (!user) {
            return c.json({ error: "User not found" }, 404);
        }
        const isValidPassword = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return c.json({ error: "Current password is incorrect" }, 400);
        }
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 10);
        const result = await userRepository.changePassword(userId, hashedNewPassword);
        return c.json(result, 200);
    }
    catch (error) {
        console.error("Error in /changePassword route:", error);
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
});
users.post("/checkAvailability", async (c) => {
    try {
        const userId = c.get("userId");
        const body = await c.req.json();
        const { username, email } = body;
        if (!username && !email) {
            return c.json({
                error: "At least username or email must be provided",
            }, 400);
        }
        const availability = await userRepository.checkAvailabilityForEdit(userId, username, email);
        return c.json(availability, 200);
    }
    catch (error) {
        console.error("Error in /checkAvailability route:", error);
        if (error instanceof Error) {
            return c.json({ error: error.message }, 500);
        }
        return c.json({ error: "Internal server error" }, 500);
    }
});
exports.default = users;
//# sourceMappingURL=user.js.map