import * as cron from 'node-cron';
import ExpenseNotificationService, { NotificationResult } from './expenseNotificationService';

interface SimpleCronConfig {
  brevoApiKey: string;
  senderEmail?: string;
  senderName?: string;
  timezone?: string;
  dailyTime?: string; // Format: "HH:MM" (24-hour)
  enabled?: boolean;
}

interface CronJobResult {
  timestamp: Date;
  result: NotificationResult;
  duration: number; // in milliseconds
}

class SimplePaymentNotificationCron {
  private notificationService: ExpenseNotificationService;
  private config: Required<SimpleCronConfig>;
  private job: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;
  private lastResults: CronJobResult[] = [];

  constructor(config: SimpleCronConfig) {
    // Set default configuration
    this.config = {
      brevoApiKey: config.brevoApiKey,
      senderEmail: config.senderEmail || 'noreply@yourapp.com',
      senderName: config.senderName || 'Your Finance App',
      timezone: config.timezone || 'Europe/Bucharest',
      dailyTime: config.dailyTime || '08:00', // 8:00 AM
      enabled: config.enabled ?? true
    };

    this.notificationService = new ExpenseNotificationService(
      this.config.brevoApiKey,
      this.config.senderEmail,
      this.config.senderName
    );
  }

  // Start the daily cron job
  start(): void {
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
      const cronExpression = `${minute} ${hour} * * *`; // Daily at specified time

      this.job = cron.schedule(cronExpression, async () => {
        await this.runDailyNotifications();
      }, {
        timezone: this.config.timezone
      });

      this.isRunning = true;
      console.log(`✅ Daily payment notifications scheduled for ${this.config.dailyTime} (${this.config.timezone})`);
    } catch (error) {
      console.error('❌ Failed to start daily cron job:', error);
      throw error;
    }
  }

  // Stop the cron job
  stop(): void {
    if (this.job) {
      console.log('🛑 Stopping daily payment notification cron...');
      this.job.stop();
      this.job = null;
      this.isRunning = false;
      console.log('✅ Daily cron job stopped');
    }
  }

  // Run daily notifications - this will be called once per day
  private async runDailyNotifications(): Promise<void> {
    const startTime = Date.now();
    console.log('📧 Running daily payment notifications...');

    try {
      // Send notifications for all payments (income and expenses) that should be notified today
      // This includes checking user preferences for notification timing
      const result = await this.notificationService.sendDailyScheduledNotifications();

      const duration = Date.now() - startTime;
      const jobResult: CronJobResult = {
        timestamp: new Date(),
        result,
        duration
      };

      this.lastResults.push(jobResult);
      this.trimResults();

      if (result.success > 0 || result.failed > 0) {
        console.log(`✅ Daily notifications completed: ${result.success} sent, ${result.failed} failed (${duration}ms)`);
      } else {
        console.log(`✅ No notifications to send today (${duration}ms)`);
      }
    } catch (error) {
      console.error('❌ Daily notifications failed:', error);
    }
  }

  // Get job status
  getStatus(): {
    isRunning: boolean;
    nextRun: string | null;
    lastResults: CronJobResult[];
    config: Required<SimpleCronConfig>;
  } {
    let nextRun = null;
    if (this.job && this.isRunning) {
      // Calculate next run time
      const [hour, minute] = this.config.dailyTime.split(':');
      const now = new Date();
      const next = new Date();
      next.setHours(parseInt(hour), parseInt(minute), 0, 0);
      
      // If time has passed today, schedule for tomorrow
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
      lastResults: this.lastResults.slice(-10), // Last 10 results
      config: this.config
    };
  }

  // Update configuration and restart if needed
  updateConfig(newConfig: Partial<SimpleCronConfig>): void {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }

    // Update configuration
    Object.assign(this.config, newConfig);

    // Recreate notification service if API key changed
    if (newConfig.brevoApiKey || newConfig.senderEmail || newConfig.senderName) {
      this.notificationService = new ExpenseNotificationService(
        this.config.brevoApiKey,
        this.config.senderEmail,
        this.config.senderName
      );
    }

    if (wasRunning && this.config.enabled) {
      this.start();
    }

    console.log('🔄 Configuration updated');
  }

  // Manual trigger for testing
  async triggerManualRun(): Promise<NotificationResult> {
    console.log('🔧 Manual trigger: daily payment notifications');
    await this.runDailyNotifications();
    const lastResult = this.lastResults[this.lastResults.length - 1];
    return lastResult?.result || { success: 0, failed: 0 };
  }

  // Enable/disable the cron job
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (enabled && !this.isRunning) {
      this.start();
    } else if (!enabled && this.isRunning) {
      this.stop();
    }
    
    console.log(`${enabled ? '✅ Enabled' : '⏸️ Disabled'} daily payment notifications`);
  }

  // Keep only last 30 results
  private trimResults(): void {
    if (this.lastResults.length > 30) {
      this.lastResults = this.lastResults.slice(-30);
    }
  }
}

export default SimplePaymentNotificationCron;
export type { SimpleCronConfig, CronJobResult };