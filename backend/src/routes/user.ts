import { Hono } from "hono";
import { UserRepository } from "../repositories/userRepository";
import bcrypt from "bcrypt";

const users = new Hono();
const userRepository = new UserRepository();

users.post("/getUser", async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json(
        {
          error: "Missing userId in /getUser",
        },
        400
      );
    }

    const user = await userRepository.findById(userId);
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    const { password, ...userWithoutPassword } = user;
    return c.json({ user: userWithoutPassword }, 200);
    
  } catch (error) {
    console.error("Error in /getUser route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

users.post("/editUser", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, firstName, lastName, username, email, password } = body;

    if (!userId) {
      return c.json(
        {
          error: "Missing required field (userId)",
        },
        400
      );
    }

    if (!firstName || !lastName || !username) {
      return c.json(
        {
          error: "Missing required fields (firstName, lastName, username)",
        },
        400
      );
    }

  
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return c.json({ error: "Invalid email format" }, 400);
    }

  
    let hashedPassword;
    if (password) {
      if (password.length < 6) {
        return c.json({ error: "Password must be at least 6 characters long" }, 400);
      }
      hashedPassword = await bcrypt.hash(password, 10);
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
    
  } catch (error) {
    console.error("Error in /editUser route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});


users.post("/changePassword", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, currentPassword, newPassword } = body;

    if (!userId || !currentPassword || !newPassword) {
      return c.json(
        {
          error: "Missing required fields (userId, currentPassword, newPassword)",
        },
        400
      );
    }

    if (newPassword.length < 6) {
      return c.json({ error: "New password must be at least 6 characters long" }, 400);
    }

 
    const user = await userRepository.findById(userId);
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

  
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return c.json({ error: "Current password is incorrect" }, 400);
    }

    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    
    const result = await userRepository.changePassword(userId, hashedNewPassword);
    
    return c.json(result, 200);
    
  } catch (error) {
    console.error("Error in /changePassword route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});


users.post("/checkAvailability", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, username, email } = body;

    if (!userId) {
      return c.json(
        {
          error: "Missing userId in /checkAvailability",
        },
        400
      );
    }

    if (!username && !email) {
      return c.json(
        {
          error: "At least username or email must be provided",
        },
        400
      );
    }

    const availability = await userRepository.checkAvailabilityForEdit(userId, username, email);
    
    return c.json(availability, 200);
    
  } catch (error) {
    console.error("Error in /checkAvailability route:", error);
    if (error instanceof Error) {
      return c.json({ error: error.message }, 500);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default users;