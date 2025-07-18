import { Context, Next } from "hono";
import { jwtVerify } from "jose";
import "dotenv/config";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");

export const verifyToken = async (c: Context, next: Next) => {
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

    const { payload } = await jwtVerify(token, secret);

    c.set("userId", payload.userId as number);
    c.set("user", payload);

    await next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return c.json({ error: "Unauthorized - Invalid token" }, 401);
  }
};
