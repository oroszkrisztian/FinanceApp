import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

const auth = new Hono();
const prisma = new PrismaClient();

// Login route
auth.post("/login", async (c) => {
  try {
    const { username, password } = await c.req.json();

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });

    // Debug log
    console.log("Found user:", user);

    // Check if user exists
    if (!user) {
      console.log("User not found");
      return c.json({ error: "Invalid username or password" }, 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    // Debug log
    console.log("Password valid:", isValidPassword);
    
    if (!isValidPassword) {
      console.log("Invalid password");
      return c.json({ error: "Invalid username or password" }, 401);
    }

    // Generate JWT token
    const token = sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Debug log - check final response structure
    const response = {
      user: userWithoutPassword,
      token
    };
    console.log("Sending response:", response);
    
    return c.json(response);
    
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Register route
auth.post("/register", async (c) => {
  try {
    const { firstName, lastName, username, email, password } =
      await c.req.json();

    // Check if all fields are provided
    if (!firstName || !lastName || !username || !email || !password) {
      return c.json({ error: "All fields are required" }, 400);
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return c.json({ error: "Username is already taken" }, 400);
      }
      if (existingUser.email === email) {
        return c.json({ error: "Email is already registered" }, 400);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return c.json(
      {
        message: "Registration successful",
        user: userWithoutPassword,
      },
      201
    );
  } catch (error: any) {
    // Type assertion for error
    console.error("Registration error:", error);

    // Check if it's a Prisma error with a code property
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2002") {
        return c.json({ error: "Username or email already exists" }, 400);
      }
    }

    return c.json({ error: "Internal server error" }, 500);
  }
});

export default auth;
