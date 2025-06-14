"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
require("dotenv/config");
const verifyToken = async (c, next) => {
    try {
        const authHeader = c.req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return c.json({ error: "Unauthorized - No token provided" }, 401);
        }
        const token = authHeader.substring(7);
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET not configured");
            return c.json({ error: "Server configuration error" }, 500);
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        c.set("userId", decoded.id || decoded.userId);
        c.set("user", decoded);
        await next();
    }
    catch (error) {
        console.error("Token verification failed:", error);
        return c.json({ error: "Unauthorized - Invalid token" }, 401);
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.js.map