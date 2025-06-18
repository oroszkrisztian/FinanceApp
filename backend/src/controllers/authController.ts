import { Context } from "hono";
import { AuthService } from "../services/authService";

class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(c: Context) {
    try {
      const credentials = await c.req.json();

      // Extract IP address and user agent from request
      const ipAddress =
        c.req.header("x-forwarded-for") ||
        c.req.header("x-real-ip") ||
        c.req.header("cf-connecting-ip") ||
        "unknown";
      const userAgent = c.req.header("user-agent") || "unknown";

      const result = await this.authService.login(
        credentials,
        ipAddress,
        userAgent
      );
      return c.json(result);
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof AuthError || error instanceof Error) {
        return c.json({ error: error.message }, 401);
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  }

  async register(c: Context) {
    try {
      const data = await c.req.json();
      const result = await this.authService.register(data);
      return c.json(
        {
          message: "Registration successful",
          ...result,
        },
        201
      );
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof AuthError || error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  }

  async refresh(c: Context) {
    try {
      const { token } = await c.req.json();

      if (!token) {
        return c.json({ error: "Token is required" }, 400);
      }

      const result = await this.authService.refreshToken(token);
      return c.json(result);
    } catch (error) {
      console.error("Token refresh error:", error);
      if (error instanceof AuthError || error instanceof Error) {
        return c.json({ error: error.message }, 401);
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  }
}
