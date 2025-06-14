"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_server_1 = require("@hono/node-server");
const hono_1 = require("hono");
const cors_1 = require("hono/cors");
const logger_1 = require("hono/logger");
const accounts_1 = __importDefault(require("./routes/accounts"));
const transaction_1 = __importDefault(require("./routes/transaction"));
const categories_1 = __importDefault(require("./routes/categories"));
const budget_1 = __importDefault(require("./routes/budget"));
const payment_1 = __importDefault(require("./routes/payment"));
const user_1 = __importDefault(require("./routes/user"));
const auth_1 = __importDefault(require("./routes/auth"));
const ai_1 = __importDefault(require("./routes/ai"));
require("dotenv/config");
const expenseNotificationCron_1 = __importDefault(require("./services/expenseNotificationCron"));
const app = new hono_1.Hono();
const port = parseInt(process.env.PORT || "3000");
// Initialize the payment notification cron job
const paymentCron = new expenseNotificationCron_1.default({
    brevoApiKey: process.env.BREVO_API_KEY,
    senderEmail: process.env.BREVO_SENDER_EMAIL || "noreply@yourfinanceapp.com",
    senderName: process.env.BREVO_SENDER_NAME || "Your Finance App",
    timezone: process.env.TIMEZONE || "Europe/Bucharest",
    dailyTime: process.env.DAILY_NOTIFICATION_TIME || "08:00", // 8:00 AM
    enabled: process.env.NOTIFICATIONS_ENABLED !== "false", // Default to true unless explicitly disabled
});
// Middleware
app.use("*", (0, cors_1.cors)({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://finance-app-frontend-bice.vercel.app",
    ],
    allowMethods: ["POST", "GET", "DELETE", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use("*", (0, logger_1.logger)());
// Mount routes
app.route("/auth", auth_1.default);
app.route("/accounts", accounts_1.default);
app.route("/transaction", transaction_1.default);
app.route("/categories", categories_1.default);
app.route("/budget", budget_1.default);
app.route("/payment", payment_1.default);
app.route("/user", user_1.default);
app.route("/ai", ai_1.default);
// Test Gemini API connection
app.get("/test-gemini", async (c) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return c.json({
                success: false,
                error: "GEMINI_API_KEY not configured",
            }, 500);
        }
        const { GoogleGenerativeAI } = await Promise.resolve().then(() => __importStar(require("@google/generative-ai")));
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Say hello and confirm you're working correctly for financial analysis.");
        const response = await result.response;
        const text = response.text();
        return c.json({
            success: true,
            message: "Gemini API connection successful",
            response: text,
            config: {
                apiKeyProvided: !!process.env.GEMINI_API_KEY,
                keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + "..." : "MISSING",
            },
        });
    }
    catch (error) {
        console.error("❌ Gemini test failed:", error);
        return c.json({
            success: false,
            error: "Gemini API test failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
});
// Cron job management routes
app.get("/notifications/status", (c) => {
    try {
        const status = paymentCron.getStatus();
        return c.json(status);
    }
    catch (error) {
        console.error("Error getting notification status:", error);
        return c.json({ error: "Failed to get notification status" }, 500);
    }
});
app.post("/notifications/trigger", async (c) => {
    try {
        console.log("Manual notification trigger requested");
        const result = await paymentCron.triggerManualRun();
        return c.json({
            message: "Manual notification run completed",
            result,
        });
    }
    catch (error) {
        console.error("Error triggering manual notification:", error);
        return c.json({ error: "Failed to trigger manual notification" }, 500);
    }
});
app.post("/notifications/enable", (c) => {
    try {
        paymentCron.setEnabled(true);
        return c.json({ message: "Notifications enabled successfully" });
    }
    catch (error) {
        console.error("Error enabling notifications:", error);
        return c.json({ error: "Failed to enable notifications" }, 500);
    }
});
app.post("/notifications/disable", (c) => {
    try {
        paymentCron.setEnabled(false);
        return c.json({ message: "Notifications disabled successfully" });
    }
    catch (error) {
        console.error("Error disabling notifications:", error);
        return c.json({ error: "Failed to disable notifications" }, 500);
    }
});
app.put("/notifications/config", async (c) => {
    try {
        const body = await c.req.json();
        const { dailyTime, timezone, enabled } = body;
        const updateConfig = {};
        if (dailyTime)
            updateConfig.dailyTime = dailyTime;
        if (timezone)
            updateConfig.timezone = timezone;
        if (typeof enabled === "boolean")
            updateConfig.enabled = enabled;
        paymentCron.updateConfig(updateConfig);
        return c.json({
            message: "Notification configuration updated successfully",
            newConfig: paymentCron.getStatus().config,
        });
    }
    catch (error) {
        console.error("Error updating notification config:", error);
        return c.json({ error: "Failed to update notification configuration" }, 500);
    }
});
app.post("/test-email", async (c) => {
    try {
        const body = await c.req.json();
        const { testEmail } = body;
        if (!testEmail) {
            return c.json({ error: "testEmail is required" }, 400);
        }
        console.log(`🧪 Testing email to: ${testEmail}`);
        const { default: BrevoEmailService } = await Promise.resolve().then(() => __importStar(require("./services/brevoService")));
        const brevoService = new BrevoEmailService(process.env.BREVO_API_KEY);
        const connectionTest = await brevoService.testConnection();
        if (!connectionTest) {
            return c.json({
                error: "Brevo connection failed",
                details: "Check your BREVO_API_KEY and Brevo account status",
            }, 500);
        }
        const testEmailData = {
            sender: {
                name: process.env.BREVO_SENDER_NAME || "Test App",
                email: process.env.BREVO_SENDER_EMAIL || "test@yourapp.com",
            },
            to: [
                {
                    email: testEmail,
                    name: "Test User",
                },
            ],
            subject: "Test Email from Your Finance App",
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background-color: #007bff; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">🧪 Test Email</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">Email System Test</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Status:</td>
                <td style="padding: 10px 0; text-align: right; color: #28a745; font-weight: bold;">✅ Working</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Timestamp:</td>
                <td style="padding: 10px 0; text-align: right;">${new Date().toLocaleString()}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">From:</td>
                <td style="padding: 10px 0; text-align: right;">${process.env.BREVO_SENDER_EMAIL}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">API:</td>
                <td style="padding: 10px 0; text-align: right;">Brevo</td>
              </tr>
            </table>

            <div style="margin: 30px 0; padding: 15px; background-color: #e8f5e8; border-radius: 5px;">
              <p style="margin: 0; color: #666;">
                <strong>✅ Success!</strong> If you received this email, your notification system is working correctly.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #888; font-size: 12px;">
            <p style="margin: 0;">This is a test email from your Finance App notification system.</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Your Finance App. All rights reserved.</p>
          </div>
        </div>
      `,
            textContent: `
Test Email from Your Finance App

Status: ✅ Working
Timestamp: ${new Date().toLocaleString()}
From: ${process.env.BREVO_SENDER_EMAIL}
API: Brevo

✅ Success! If you received this email, your notification system is working correctly.
      `,
            tags: ["test-email"],
        };
        const result = await brevoService.sendTransactionalEmail(testEmailData);
        return c.json({
            message: "Test email sent successfully",
            result,
            config: {
                brevoApiKey: process.env.BREVO_API_KEY
                    ? `${process.env.BREVO_API_KEY.substring(0, 10)}...`
                    : "MISSING",
                senderEmail: process.env.BREVO_SENDER_EMAIL,
                senderName: process.env.BREVO_SENDER_NAME,
            },
        });
    }
    catch (error) {
        console.error("❌ Test email failed:", error);
        return c.json({
            error: "Failed to send test email",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
    }
});
app.get("/test-brevo", async (c) => {
    try {
        const { default: BrevoEmailService } = await Promise.resolve().then(() => __importStar(require("./services/brevoService")));
        const brevoService = new BrevoEmailService(process.env.BREVO_API_KEY);
        const isConnected = await brevoService.testConnection();
        return c.json({
            brevoConnected: isConnected,
            config: {
                apiKeyProvided: !!process.env.BREVO_API_KEY,
                senderEmail: process.env.BREVO_SENDER_EMAIL,
                senderName: process.env.BREVO_SENDER_NAME,
            },
        });
    }
    catch (error) {
        console.error("❌ Brevo test failed:", error);
        return c.json({
            error: "Brevo test failed",
            details: error instanceof Error ? error.message : "Unknown error",
        }, 500);
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
    }
    catch (error) {
        console.error("Proxy error:", error);
        return c.json({ error: "Failed to fetch exchange rates" }, 500);
    }
});
app.get("/", (c) => c.text("Server is running"));
// Start the server
console.log(`Server is running on port ${port}`);
if (process.env.GEMINI_API_KEY) {
    console.log("✅ Gemini API key configured");
}
else {
    console.log("⚠️  Gemini API key not found in environment variables");
}
// Start the payment notification cron job
try {
    paymentCron.start();
    console.log("✅ Payment notification cron job started successfully");
}
catch (error) {
    console.error("❌ Failed to start payment notification cron job:", error);
}
(0, node_server_1.serve)({
    fetch: app.fetch,
    port,
});
// Graceful shutdown handling
const gracefulShutdown = () => {
    console.log("\n🛑 Shutting down server...");
    // Stop the cron job
    try {
        paymentCron.stop();
        console.log("✅ Payment notification cron job stopped");
    }
    catch (error) {
        console.error("❌ Error stopping cron job:", error);
    }
    process.exit(0);
};
// Handle different shutdown signals
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
//# sourceMappingURL=index.js.map