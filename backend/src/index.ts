import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import auth from './routes/auth';
import accounts from "./routes/accounts";
import transaction from "./routes/transaction";

import 'dotenv/config';

const app = new Hono();
const port = parseInt(process.env.PORT || "3000");

// Middleware
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  allowMethods: ['POST', 'GET', 'DELETE', 'PUT', 'OPTIONS'], 
  allowHeaders: ['Content-Type', 'Authorization'], 
  credentials: true,
}));

app.use("*", logger());

// Mount routes
app.route('/auth', auth);
app.route("/accounts", accounts);
app.route("/transaction", transaction);



app.get("/exchange-rates", async (c) => {
  try {
    
    const response = await fetch("https://www.bnr.ro/nbrfxrates.xml");

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }

    
    const xmlText = await response.text();

    
    return c.text(xmlText, 200, {
      "Content-Type": "application/xml",
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return c.json({ error: "Failed to fetch exchange rates" }, 500);
  }
});

// Health check
app.get("/", (c) => c.text("Server is running"));

console.log(`Server is running on port ${port}`);
serve({
  fetch: app.fetch,
  port,
});