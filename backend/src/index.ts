import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import accounts from "./routes/accounts";
import transaction from "./routes/transaction";
import categories from "./routes/categories";
import budget from "./routes/budget";
import payments from "./routes/payment";
import users from "./routes/user";
import auth from "./routes/auth";
import ai from "./routes/ai";

import "dotenv/config";

const app = new Hono();
const port = parseInt(process.env.PORT || "3000");

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "https://finance-app-frontend-bice.vercel.app",
      "https://finance-app-frontend-ebyddx0p1-oroszkrisztians-projects.vercel.app",
      "https://backendfinanceapp.krisztianorosz0.workers.dev",
    ],
    allowMethods: ["POST", "GET", "DELETE", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("*", logger());

app.route("/auth", auth);
app.route("/accounts", accounts);
app.route("/transaction", transaction);
app.route("/categories", categories);
app.route("/budget", budget);
app.route("/payment", payments);
app.route("/user", users);
app.route("/ai", ai);

app.get("/test-gemini", async (c) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return c.json(
        {
          success: false,
          error: "GEMINI_API_KEY not configured",
        },
        500
      );
    }

    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(
      "Say hello and confirm you're working correctly for financial analysis."
    );
    const response = await result.response;
    const text = response.text();

    return c.json({
      success: true,
      message: "Gemini API connection successful",
      response: text,
      config: {
        apiKeyProvided: !!process.env.GEMINI_API_KEY,
        keyPrefix: process.env.GEMINI_API_KEY
          ? process.env.GEMINI_API_KEY.substring(0, 10) + "..."
          : "MISSING",
      },
    });
  } catch (error) {
    console.error("❌ Gemini test failed:", error);
    return c.json(
      {
        success: false,
        error: "Gemini API test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});



app.get("/warmup-full", async (c) => {
  const startTime = Date.now();

  try {
    console.log("Full server warmup started");

    const { default: ExpenseNotificationService } = await import(
      "./services/expenseNotificationService"
    );
    const notificationService = new ExpenseNotificationService(
      process.env.BREVO_API_KEY!,
      process.env.BREVO_SENDER_EMAIL || "noreply@yourfinanceapp.com",
      process.env.BREVO_SENDER_NAME || "Your Finance App"
    );

    const { default: BrevoEmailService } = await import(
      "./services/brevoService"
    );
    const brevoService = new BrevoEmailService(process.env.BREVO_API_KEY!);
    await brevoService.testConnection();

    const duration = Date.now() - startTime;
    console.log(`Full warmup completed in ${duration}ms`);

    return c.json({
      status: "fully-warmed",
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      message: "Server and all services are warm and ready",
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      `⚠️ Warmup had issues but server is still warming: ${errorMessage}`
    );

    return c.json({
      status: "partially-warmed",
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      message: "Server is warm but some services may need extra time",
      warning: errorMessage,
    });
  }
});

app.post("/cron/daily-notifications", async (c) => {
  const startTime = Date.now();

  try {
    console.log("Daily notification endpoint triggered");

    const { default: ExpenseNotificationService } = await import(
      "./services/expenseNotificationService"
    );
    const notificationService = new ExpenseNotificationService(
      process.env.BREVO_API_KEY!,
      process.env.BREVO_SENDER_EMAIL || "noreply@yourfinanceapp.com",
      process.env.BREVO_SENDER_NAME || "Your Finance App"
    );

    const result = await notificationService.sendDailyScheduledNotifications();

    const duration = Date.now() - startTime;
    console.log(`Daily notifications completed in ${duration}ms:`, result);

    return c.json({
      success: true,
      message: "Daily notifications sent successfully",
      result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `❌ Daily notification endpoint failed after ${duration}ms:`,
      errorMessage
    );

    return c.json(
      {
        success: false,
        error: "Failed to send daily notifications",
        details: errorMessage,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

app.post("/cron/automatic-payments", async (c) => {
  const startTime = Date.now();

  try {
    console.log("Automatic payments cron job triggered");

    const { default: AutomaticPaymentService } = await import(
      "./services/automaticPaymentService"
    );
    const paymentService = new AutomaticPaymentService();

    const result = await paymentService.processAutomaticPayments();

    const duration = Date.now() - startTime;
    console.log(
      `Automatic payments processing completed in ${duration}ms:`,
      result
    );

    return c.json({
      success: true,
      message: "Automatic payments processed successfully",
      result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Automatic payments cron job failed after ${duration}ms:`,
      errorMessage
    );

    return c.json(
      {
        success: false,
        error: "Failed to process automatic payments",
        details: errorMessage,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
});

app.get("/test-brevo", async (c) => {
  try {
    const { default: BrevoEmailService } = await import(
      "./services/brevoService"
    );
    const brevoService = new BrevoEmailService(process.env.BREVO_API_KEY!);

    const isConnected = await brevoService.testConnection();

    return c.json({
      brevoConnected: isConnected,
      config: {
        apiKeyProvided: !!process.env.BREVO_API_KEY,
        senderEmail: process.env.BREVO_SENDER_EMAIL,
        senderName: process.env.BREVO_SENDER_NAME,
      },
    });
  } catch (error) {
    console.error("Brevo test failed:", error);
    return c.json(
      {
        error: "Brevo test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

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

app.get("/", (c) => c.text("Server is running"));

console.log(`Server is running on port ${port}`);

if (process.env.GEMINI_API_KEY) {
  console.log("Gemini API key configured");
} else {
  console.log("Gemini API key not found in environment variables");
}

serve({
  fetch: app.fetch,
  port,
});

const gracefulShutdown = () => {
  console.log("\nShutting down server...");
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
process.on("SIGQUIT", gracefulShutdown);

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown();
});
