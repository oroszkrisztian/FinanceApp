import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from './routes/auth';
import accounts from "./routes/accounts";
import 'dotenv/config';

const app = new Hono();
const port = parseInt(process.env.PORT || "3000");

// Middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
  credentials: true,
}));

app.use("*", logger());

// Mount routes
app.route('/auth', auth);
app.route("/accounts", accounts);


// Health check
app.get("/", (c) => c.text("Server is running"));

console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});