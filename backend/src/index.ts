import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const app = new Hono()
const prisma = new PrismaClient()
const port = parseInt(process.env.PORT || '3000')

// Enable CORS
app.use('/*', cors())

// Basic route to test if server is running
app.get('/', (c) => {
  return c.json({ message: 'Hello Hono!' })
})

// Auth routes
app.post('/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json()

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      }
    })

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Don't send the password back
    const { password: _, ...userWithoutPassword } = user

    return c.json({
      user: userWithoutPassword,
      token: 'dummy-token' // In production, use proper JWT
    })
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ error: 'Login failed' }, 500)
  }
})

// Register route
app.post('/auth/register', async (c) => {
  try {
    const { username, password, email, firstName, lastName } = await c.req.json()

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email }
        ]
      }
    })

    if (existingUser) {
      return c.json({ error: 'Username or email already exists' }, 400)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName
      }
    })

    const { password: _, ...userWithoutPassword } = user

    return c.json({ 
      message: 'User created successfully',
      user: userWithoutPassword
    }, 201)
  } catch (error) {
    console.error('Registration error:', error)
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// Protected route example
app.get('/api/user/profile', async (c) => {
  try {
    // This is a placeholder - in production, verify JWT token
    const authHeader = c.req.header('Authorization')
    if (!authHeader) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // For demo purposes, just get the first user
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        accounts: true
      }
    })

    return c.json(user)
  } catch (error) {
    return c.json({ error: 'Failed to fetch profile' }, 500)
  }
})

// Start server
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port
})