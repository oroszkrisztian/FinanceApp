"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const brevoService_1 = __importDefault(require("./brevoService"));
const prisma = new client_1.PrismaClient();
class ExpenseNotificationService {
    brevoService;
    senderEmail;
    senderName;
    constructor(brevoApiKey, senderEmail, senderName) {
        this.brevoService = new brevoService_1.default(brevoApiKey);
        this.senderEmail = senderEmail || process.env.BREVO_SENDER_EMAIL || 'noreply@yourapp.com';
        this.senderName = senderName || process.env.BREVO_SENDER_NAME || 'Your Finance App';
    }
    async sendDailyScheduledNotifications() {
        let successCount = 0;
        let failedCount = 0;
        const details = [];
        try {
            const paymentsWithNotifications = await prisma.recurringFundAndBill.findMany({
                where: {
                    isActive: true,
                    emailNotification: true,
                    nextExecution: {
                        not: null
                    },
                    deletedAt: null
                },
                include: {
                    account: {
                        include: {
                            user: true
                        }
                    },
                    user: true,
                    categories: {
                        include: {
                            customCategory: true
                        }
                    }
                }
            });
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            for (const payment of paymentsWithNotifications) {
                if (!payment.nextExecution)
                    continue;
                const notificationDaysAhead = payment.notificationDay || this.getDefaultNotificationDays(payment);
                const dueDate = new Date(payment.nextExecution);
                dueDate.setHours(0, 0, 0, 0);
                const notificationDate = new Date(dueDate);
                notificationDate.setDate(dueDate.getDate() - notificationDaysAhead);
                if (today.getTime() === notificationDate.getTime()) {
                    const user = payment.account.user;
                    try {
                        await this.sendPaymentNotification(payment, user);
                        successCount++;
                        details.push({
                            paymentName: payment.name,
                            userEmail: user.email,
                            status: 'success',
                            type: payment.type
                        });
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                    catch (error) {
                        failedCount++;
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        details.push({
                            paymentName: payment.name,
                            userEmail: user.email,
                            status: 'failed',
                            error: errorMessage,
                            type: payment.type
                        });
                        console.error(`Failed to send notification for ${payment.name}:`, errorMessage);
                    }
                }
            }
            console.log(`Daily notification summary: ${successCount} sent, ${failedCount} failed`);
            return { success: successCount, failed: failedCount, details };
        }
        catch (error) {
            console.error('Error in sendDailyScheduledNotifications:', error);
            throw error;
        }
    }
    getDefaultNotificationDays(payment) {
        switch (payment.frequency) {
            case 'DAILY':
                return 1;
            case 'WEEKLY':
                return 2;
            case 'BIWEEKLY':
                return 3;
            case 'MONTHLY':
                return 3;
            case 'QUARTERLY':
                return 7;
            case 'YEARLY':
                return 14;
            case 'ONCE':
                return 3;
            case 'CUSTOM':
                return 3;
            default:
                return 3;
        }
    }
    async sendPaymentNotification(payment, user) {
        if (!payment.nextExecution) {
            throw new Error('Payment has no next execution date');
        }
        const daysUntilDue = Math.ceil((new Date(payment.nextExecution).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        const categoryNames = payment.categories
            .map(cat => cat.customCategory.name)
            .join(', ') || 'Uncategorized';
        const isIncome = payment.type === 'INCOME';
        const urgencyColor = isIncome
            ? (daysUntilDue <= 1 ? '#28a745' : daysUntilDue <= 3 ? '#20c997' : '#17a2b8')
            : (daysUntilDue <= 1 ? '#dc3545' : daysUntilDue <= 3 ? '#fd7e14' : '#e74c3c');
        const urgencyText = isIncome
            ? (daysUntilDue <= 1 ? '💰 Income Due Soon!' : daysUntilDue <= 3 ? '💰 Income This Week' : '📅 Upcoming Income')
            : (daysUntilDue <= 1 ? '🚨 Expense Due Soon!' : daysUntilDue <= 3 ? '⚠️ Expense Due This Week' : '📅 Upcoming Expense');
        const actionText = isIncome
            ? 'You will receive this income in your account'
            : 'Ensure sufficient funds are available in your account';
        const emailData = {
            sender: {
                name: this.senderName,
                email: this.senderEmail
            },
            to: [{
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`
                }],
            subject: `${urgencyText} ${payment.name} - ${payment.amount} ${payment.currency}`,
            htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background-color: ${urgencyColor}; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">${urgencyText}</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">${payment.name}</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Amount:</td>
                <td style="padding: 10px 0; text-align: right; color: ${urgencyColor}; font-weight: bold;">
                  ${isIncome ? '+' : ''}${payment.amount} ${payment.currency}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Due Date:</td>
                <td style="padding: 10px 0; text-align: right;">
                  ${new Date(payment.nextExecution).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Days Until Due:</td>
                <td style="padding: 10px 0; text-align: right; color: ${urgencyColor}; font-weight: bold;">
                  ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Account:</td>
                <td style="padding: 10px 0; text-align: right;">${payment.account.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Type:</td>
                <td style="padding: 10px 0; text-align: right;">${isIncome ? 'Income' : 'Expense'}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold;">Frequency:</td>
                <td style="padding: 10px 0; text-align: right;">${payment.frequency}</td>
              </tr>
            </table>

            ${payment.description ? `
              <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-radius: 5px;">
                <strong>Description:</strong><br>
                ${payment.description}
              </div>
            ` : ''}

            <div style="margin: 30px 0; padding: 15px; background-color: ${isIncome ? '#e8f5e8' : '#fff8e1'}; border-radius: 5px;">
              <p style="margin: 0; color: #666;">
                <strong>💡 Reminder:</strong> ${actionText} (${payment.account.name}).
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #888; font-size: 12px;">
            <p style="margin: 0;">You're receiving this because you enabled notifications for this recurring ${payment.type.toLowerCase()}.</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Your Finance App. All rights reserved.</p>
          </div>
        </div>
      `,
            textContent: `
${urgencyText}

${payment.name}
Amount: ${isIncome ? '+' : ''}${payment.amount} ${payment.currency}
Due Date: ${new Date(payment.nextExecution).toLocaleDateString()}
Days Until Due: ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}
Account: ${payment.account.name}
Type: ${payment.type}
Frequency: ${payment.frequency}
${payment.description ? `Description: ${payment.description}` : ''}

💡 Reminder: ${actionText} (${payment.account.name}).

You're receiving this because you enabled notifications for this recurring ${payment.type.toLowerCase()}.
      `,
            tags: [`${payment.type.toLowerCase()}-notification`, `days-${daysUntilDue}`, payment.frequency.toLowerCase()]
        };
        try {
            await this.brevoService.sendTransactionalEmail(emailData);
        }
        catch (error) {
            console.error(`Failed to send notification for ${payment.type.toLowerCase()} ${payment.name}:`, error);
            throw error;
        }
    }
}
exports.default = ExpenseNotificationService;
//# sourceMappingURL=expenseNotificationService.js.map