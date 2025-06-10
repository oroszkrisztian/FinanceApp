import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import "dotenv/config";

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

  
    c.set("userId", decoded.id || decoded.userId);
    c.set("user", decoded);

    await next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return c.json({ error: "Unauthorized - Invalid token" }, 401);
  }
};
