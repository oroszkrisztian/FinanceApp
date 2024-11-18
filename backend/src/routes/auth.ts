import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const auth = new Hono();
const prisma = new PrismaClient();

// Login route
auth.post("/login", async (c) => {
  try {
    const { username, password } = await c.req.json();

    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const { password: _, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword });

  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Register route
auth.post("/register", async (c) => {
  try {
    const { firstName, lastName, username, email, password } = await c.req.json();

    // Check if all fields are provided
    if (!firstName || !lastName || !username || !email || !password) {
      return c.json({ error: "All fields are required" }, 400);
    }

    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
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
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return c.json({
      message: "Registration successful",
      user: userWithoutPassword
    }, 201);

  } catch (error: any) { // Type assertion for error
    console.error('Registration error:', error);
    
    // Check if it's a Prisma error with a code property
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        return c.json({ error: "Username or email already exists" }, 400);
      }
    }

    return c.json({ error: "Internal server error" }, 500);
  }
});

export default auth;