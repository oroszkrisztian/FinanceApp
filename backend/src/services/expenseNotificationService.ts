// services/expenseNotificationService.ts
import { PrismaClient, RecurringFundAndBill, User, Account, CustomCategory } from '@prisma/client';
import BrevoEmailService, { TransactionalEmailData } from './brevoService';

const prisma = new PrismaClient();

interface UpcomingPayment extends RecurringFundAndBill {
  account: Account & {
    user: User;
  };
  user: User[];
  categories: Array<{
    customCategory: CustomCategory;
  }>;
}

interface NotificationResult {
  success: number;
  failed: number;
  details?: Array<{
    paymentName: string;
    userEmail: string;
    status: 'success' | 'failed';
    error?: string;
    type: 'INCOME' | 'EXPENSE';
  }>;
}

interface PaymentSummary {
  totalAmount: number;
  paymentCount: number;
  payments: UpcomingPayment[];
  currency: string;
  type: 'INCOME' | 'EXPENSE' | 'BOTH';
}

class ExpenseNotificationService {
  private brevoService: BrevoEmailService;
  private senderEmail: string;
  private senderName: string;

  constructor(brevoApiKey: string, senderEmail?: string, senderName?: string) {
    this.brevoService = new BrevoEmailService(brevoApiKey);
    this.senderEmail = senderEmail || process.env.BREVO_SENDER_EMAIL || 'noreply@yourapp.com';
    this.senderName = senderName || process.env.BREVO_SENDER_NAME || 'Your Finance App';
  }

  // NEW METHOD: Send notifications that are scheduled for today
  async sendDailyScheduledNotifications(): Promise<NotificationResult> {
    let successCount = 0;
    let failedCount = 0;
    const details: NotificationResult['details'] = [];

    try {
      // Get all active recurring payments (both income and expenses) with email notifications enabled
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

      console.log(`📧 Checking ${paymentsWithNotifications.length} recurring payments for notifications to send today`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const payment of paymentsWithNotifications as UpcomingPayment[]) {
        if (!payment.nextExecution) continue;

        // Get notification days ahead preference from the database field
        const notificationDaysAhead = payment.notificationDay || this.getDefaultNotificationDays(payment);
        
        // Calculate the notification date (X days before the due date)
        const dueDate = new Date(payment.nextExecution);
        dueDate.setHours(0, 0, 0, 0);
        
        const notificationDate = new Date(dueDate);
        notificationDate.setDate(dueDate.getDate() - notificationDaysAhead);
        
        // Check if today is the notification date
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
            
            console.log(`✅ Sent ${payment.type.toLowerCase()} notification for ${payment.name} (due in ${notificationDaysAhead} days)`);
            
            // Add delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            failedCount++;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            details.push({
              paymentName: payment.name,
              userEmail: user.email,
              status: 'failed',
              error: errorMessage,
              type: payment.type
            });
            
            console.error(`❌ Failed to send notification for ${payment.name}:`, errorMessage);
          }
        }
      }

      console.log(`📊 Daily notification summary: ${successCount} sent, ${failedCount} failed`);
      return { success: successCount, failed: failedCount, details };
      
    } catch (error) {
      console.error('Error in sendDailyScheduledNotifications:', error);
      throw error;
    }
  }

  // Helper method to get default notification days based on payment frequency
  private getDefaultNotificationDays(payment: UpcomingPayment): number {
    // You can customize these defaults based on your business logic
    switch (payment.frequency) {
      case 'DAILY':
        return 1; // 1 day ahead for daily payments
      case 'WEEKLY':
        return 2; // 2 days ahead for weekly payments
      case 'BIWEEKLY':
        return 3; // 3 days ahead for biweekly payments
      case 'MONTHLY':
        return 3; // 3 days ahead for monthly payments
      case 'QUARTERLY':
        return 7; // 1 week ahead for quarterly payments
      case 'YEARLY':
        return 14; // 2 weeks ahead for yearly payments
      case 'ONCE':
        return 3; // 3 days ahead for one-time payments
      case 'CUSTOM':
        return 3; // 3 days ahead for custom frequency
      default:
        return 3; // Default 3 days ahead
    }
  }

  // Get upcoming payments (both income and expenses) that need email notifications
  async getUpcomingPayments(daysAhead: number = 7, type?: 'INCOME' | 'EXPENSE'): Promise<UpcomingPayment[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    try {
      const whereCondition: any = {
        isActive: true,
        emailNotification: true,
        nextExecution: {
          gte: now,
          lte: futureDate
        },
        deletedAt: null
      };

      // Add type filter if specified
      if (type) {
        whereCondition.type = type;
      }

      const upcomingPayments = await prisma.recurringFundAndBill.findMany({
        where: whereCondition,
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
        },
        orderBy: {
          nextExecution: 'asc'
        }
      });

      return upcomingPayments as UpcomingPayment[];
    } catch (error) {
      console.error('Error fetching upcoming payments:', error);
      throw new Error('Failed to fetch upcoming payments from database');
    }
  }

  // Send notification email for a single payment (income or expense)
  async sendPaymentNotification(payment: UpcomingPayment, user: User): Promise<void> {
    if (!payment.nextExecution) {
      throw new Error('Payment has no next execution date');
    }

    const daysUntilDue = Math.ceil(
      (new Date(payment.nextExecution).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    const categoryNames = payment.categories
      .map(cat => cat.customCategory.name)
      .join(', ') || 'Uncategorized';

    // Different colors and messaging for income vs expense
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

    const emailData: TransactionalEmailData = {
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
      console.log(`✅ Notification sent for ${payment.type.toLowerCase()}: ${payment.name} to ${user.email}`);
    } catch (error) {
      console.error(`❌ Failed to send notification for ${payment.type.toLowerCase()} ${payment.name}:`, error);
      throw error;
    }
  }

  // Legacy method - kept for backward compatibility (expenses only)
  async sendExpenseNotification(expense: UpcomingPayment, user: User): Promise<void> {
    return this.sendPaymentNotification(expense, user);
  }

  // Send notifications for all upcoming payments
  async sendAllUpcomingPaymentNotifications(daysAhead: number = 7, type?: 'INCOME' | 'EXPENSE'): Promise<NotificationResult> {
    let successCount = 0;
    let failedCount = 0;
    const details: NotificationResult['details'] = [];

    try {
      const upcomingPayments = await this.getUpcomingPayments(daysAhead, type);
      
      console.log(`📧 Found ${upcomingPayments.length} upcoming ${type ? type.toLowerCase() + 's' : 'payments'} to notify about`);

      if (upcomingPayments.length === 0) {
        return { success: 0, failed: 0, details: [] };
      }

      for (const payment of upcomingPayments) {
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
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          details.push({
            paymentName: payment.name,
            userEmail: user.email,
            status: 'failed',
            error: errorMessage,
            type: payment.type
          });
        }
      }

      console.log(`📊 Notification summary: ${successCount} sent, ${failedCount} failed`);
      return { success: successCount, failed: failedCount, details };
      
    } catch (error) {
      console.error('Error in sendAllUpcomingPaymentNotifications:', error);
      throw error;
    }
  }

  // Legacy method - kept for backward compatibility (expenses only)
  async sendAllUpcomingExpenseNotifications(daysAhead: number = 7): Promise<NotificationResult> {
    return this.sendAllUpcomingPaymentNotifications(daysAhead, 'EXPENSE');
  }

  // Send notification for payments due today
  async sendTodayPaymentNotifications(type?: 'INCOME' | 'EXPENSE'): Promise<NotificationResult> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
      const whereCondition: any = {
        isActive: true,
        emailNotification: true,
        nextExecution: {
          gte: today,
          lt: tomorrow
        },
        deletedAt: null
      };

      if (type) {
        whereCondition.type = type;
      }

      const todayPayments = await prisma.recurringFundAndBill.findMany({
        where: whereCondition,
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

      let successCount = 0;
      let failedCount = 0;
      const details: NotificationResult['details'] = [];

      for (const payment of todayPayments as UpcomingPayment[]) {
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
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          details.push({
            paymentName: payment.name,
            userEmail: user.email,
            status: 'failed',
            error: errorMessage,
            type: payment.type
          });
        }
      }

      return { success: successCount, failed: failedCount, details };
      
    } catch (error) {
      console.error('Error in sendTodayPaymentNotifications:', error);
      throw error;
    }
  }

  // Legacy method - kept for backward compatibility (expenses only)
  async sendTodayExpenseNotifications(): Promise<NotificationResult> {
    return this.sendTodayPaymentNotifications('EXPENSE');
  }

  // Get payment summary for a specific user
  async getPaymentSummaryForUser(userId: number, daysAhead: number = 30, type?: 'INCOME' | 'EXPENSE'): Promise<PaymentSummary> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    try {
      const whereCondition: any = {
        isActive: true,
        nextExecution: {
          gte: now,
          lte: futureDate
        },
        account: {
          userId: userId
        },
        deletedAt: null
      };

      if (type) {
        whereCondition.type = type;
      }

      const payments = await prisma.recurringFundAndBill.findMany({
        where: whereCondition,
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
        },
        orderBy: {
          nextExecution: 'asc'
        }
      }) as UpcomingPayment[];

      const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const currency = payments.length > 0 ? payments[0].currency : 'RON';

      return {
        totalAmount,
        paymentCount: payments.length,
        payments,
        currency,
        type: type || 'BOTH'
      };
    } catch (error) {
      console.error('Error getting payment summary:', error);
      throw new Error('Failed to get payment summary');
    }
  }

  // Legacy method - kept for backward compatibility (expenses only)
  async getExpenseSummaryForUser(userId: number, daysAhead: number = 30): Promise<PaymentSummary> {
    return this.getPaymentSummaryForUser(userId, daysAhead, 'EXPENSE');
  }
}

export default ExpenseNotificationService;
export type { UpcomingPayment, NotificationResult, PaymentSummary, UpcomingPayment as UpcomingExpense };