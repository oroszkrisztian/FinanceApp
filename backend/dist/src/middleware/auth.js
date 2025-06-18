"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jose_1 = require("jose");
require("dotenv/config");
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");
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
        const { payload } = await (0, jose_1.jwtVerify)(token, secret);
        c.set("userId", payload.userId);
        c.set("user", payload);
        await next();
    }
    catch (error) {
        console.error("Token verification failed:", error);
        return c.json({ error: "Unauthorized - Invalid token" }, 401);
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.js.map