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
const app = new hono_1.Hono();
const port = parseInt(process.env.PORT || "3000");
app.use("*", (0, cors_1.cors)({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://finance-app-frontend-bice.vercel.app",
        "https://finance-app-frontend-ebyddx0p1-oroszkrisztians-projects.vercel.app",
        "https://backendfinanceapp.krisztianorosz0.workers.dev"
    ],
    allowMethods: ["POST", "GET", "DELETE", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use("*", (0, logger_1.logger)());
app.route("/auth", auth_1.default);
app.route("/accounts", accounts_1.default);
app.route("/transaction", transaction_1.default);
app.route("/categories", categories_1.default);
app.route("/budget", budget_1.default);
app.route("/payment", payment_1.default);
app.route("/user", user_1.default);
app.route("/ai", ai_1.default);
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
app.get("/warmup", (c) => {
    console.log("🔥 Server warmup request");
    return c.json({
        status: "warmed",
        timestamp: new Date().toISOString(),
        message: "Server is now warm and ready"
    });
});
app.get("/warmup-full", async (c) => {
    const startTime = Date.now();
    try {
        console.log("🔥 Full server warmup started");
        const { default: ExpenseNotificationService } = await Promise.resolve().then(() => __importStar(require("./services/expenseNotificationService")));
        const notificationService = new ExpenseNotificationService(process.env.BREVO_API_KEY, process.env.BREVO_SENDER_EMAIL || "noreply@yourfinanceapp.com", process.env.BREVO_SENDER_NAME || "Your Finance App");
        const { default: BrevoEmailService } = await Promise.resolve().then(() => __importStar(require("./services/brevoService")));
        const brevoService = new BrevoEmailService(process.env.BREVO_API_KEY);
        await brevoService.testConnection();
        const duration = Date.now() - startTime;
        console.log(`✅ Full warmup completed in ${duration}ms`);
        return c.json({
            status: "fully-warmed",
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            message: "Server and all services are warm and ready"
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Warmup had issues but server is still warming: ${errorMessage}`);
        return c.json({
            status: "partially-warmed",
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            message: "Server is warm but some services may need extra time",
            warning: errorMessage
        });
    }
});
app.post("/cron/daily-notifications", async (c) => {
    const startTime = Date.now();
    try {
        console.log("📧 Daily notification endpoint triggered");
        const { default: ExpenseNotificationService } = await Promise.resolve().then(() => __importStar(require("./services/expenseNotificationService")));
        const notificationService = new ExpenseNotificationService(process.env.BREVO_API_KEY, process.env.BREVO_SENDER_EMAIL || "noreply@yourfinanceapp.com", process.env.BREVO_SENDER_NAME || "Your Finance App");
        const result = await notificationService.sendDailyScheduledNotifications();
        const duration = Date.now() - startTime;
        console.log(`✅ Daily notifications completed in ${duration}ms:`, result);
        return c.json({
            success: true,
            message: "Daily notifications sent successfully",
            result,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Daily notification endpoint failed after ${duration}ms:`, errorMessage);
        return c.json({
            success: false,
            error: "Failed to send daily notifications",
            details: errorMessage,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
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
console.log(`Server is running on port ${port}`);
if (process.env.GEMINI_API_KEY) {
    console.log("✅ Gemini API key configured");
}
else {
    console.log("⚠️  Gemini API key not found in environment variables");
}
(0, node_server_1.serve)({
    fetch: app.fetch,
    port,
});
const gracefulShutdown = () => {
    console.log("\n🛑 Shutting down server...");
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
//# sourceMappingURL=index.js.map