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
const cron = __importStar(require("node-cron"));
const expenseNotificationService_1 = __importDefault(require("./expenseNotificationService"));
class SimplePaymentNotificationCron {
    notificationService;
    config;
    job = null;
    isRunning = false;
    lastResults = [];
    constructor(config) {
        this.config = {
            brevoApiKey: config.brevoApiKey,
            senderEmail: config.senderEmail || 'noreply@yourapp.com',
            senderName: config.senderName || 'Your Finance App',
            timezone: config.timezone || 'Europe/Bucharest',
            dailyTime: config.dailyTime || '08:00', // 8:00 AM
            enabled: config.enabled ?? true
        };
        this.notificationService = new expenseNotificationService_1.default(this.config.brevoApiKey, this.config.senderEmail, this.config.senderName);
    }
    start() {
        if (this.isRunning) {
            console.log('🔄 Daily payment notification cron is already running');
            return;
        }
        if (!this.config.enabled) {
            console.log('⏸️ Daily payment notification cron is disabled');
            return;
        }
        console.log('🚀 Starting daily payment notification cron...');
        try {
            const [hour, minute] = this.config.dailyTime.split(':');
            const cronExpression = `${minute} ${hour} * * *`;
            this.job = cron.schedule(cronExpression, async () => {
                await this.runDailyNotifications();
            }, {
                timezone: this.config.timezone
            });
            this.isRunning = true;
            console.log(`✅ Daily payment notifications scheduled for ${this.config.dailyTime} (${this.config.timezone})`);
        }
        catch (error) {
            console.error('❌ Failed to start daily cron job:', error);
            throw error;
        }
    }
    stop() {
        if (this.job) {
            console.log('🛑 Stopping daily payment notification cron...');
            this.job.stop();
            this.job = null;
            this.isRunning = false;
            console.log('✅ Daily cron job stopped');
        }
    }
    async runDailyNotifications() {
        const startTime = Date.now();
        console.log('📧 Running daily payment notifications...');
        try {
            const result = await this.notificationService.sendDailyScheduledNotifications();
            const duration = Date.now() - startTime;
            const jobResult = {
                timestamp: new Date(),
                result,
                duration
            };
            this.lastResults.push(jobResult);
            this.trimResults();
            if (result.success > 0 || result.failed > 0) {
                console.log(`✅ Daily notifications completed: ${result.success} sent, ${result.failed} failed (${duration}ms)`);
            }
            else {
                console.log(`✅ No notifications to send today (${duration}ms)`);
            }
        }
        catch (error) {
            console.error('❌ Daily notifications failed:', error);
        }
    }
    getStatus() {
        let nextRun = null;
        if (this.job && this.isRunning) {
            const [hour, minute] = this.config.dailyTime.split(':');
            const now = new Date();
            const next = new Date();
            next.setHours(parseInt(hour), parseInt(minute), 0, 0);
            if (next <= now) {
                next.setDate(next.getDate() + 1);
            }
            nextRun = next.toLocaleString('en-US', {
                timeZone: this.config.timezone,
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return {
            isRunning: this.isRunning,
            nextRun,
            lastResults: this.lastResults.slice(-10),
            config: this.config
        };
    }
    updateConfig(newConfig) {
        const wasRunning = this.isRunning;
        if (wasRunning) {
            this.stop();
        }
        Object.assign(this.config, newConfig);
        if (newConfig.brevoApiKey || newConfig.senderEmail || newConfig.senderName) {
            this.notificationService = new expenseNotificationService_1.default(this.config.brevoApiKey, this.config.senderEmail, this.config.senderName);
        }
        if (wasRunning && this.config.enabled) {
            this.start();
        }
        console.log('🔄 Configuration updated');
    }
    // Manual trigger for testing
    async triggerManualRun() {
        console.log('🔧 Manual trigger: daily payment notifications');
        await this.runDailyNotifications();
        const lastResult = this.lastResults[this.lastResults.length - 1];
        return lastResult?.result || { success: 0, failed: 0 };
    }
    // Enable/disable the cron job
    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (enabled && !this.isRunning) {
            this.start();
        }
        else if (!enabled && this.isRunning) {
            this.stop();
        }
        console.log(`${enabled ? '✅ Enabled' : '⏸️ Disabled'} daily payment notifications`);
    }
    trimResults() {
        if (this.lastResults.length > 30) {
            this.lastResults = this.lastResults.slice(-30);
        }
    }
}
exports.default = SimplePaymentNotificationCron;
//# sourceMappingURL=expenseNotificationCron.js.map