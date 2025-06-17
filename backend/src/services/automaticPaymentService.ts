import { PrismaClient, PaymentType } from "@prisma/client";
import { TransactionRepository } from "../repositories/transactionRepository";
import BrevoEmailService, { TransactionalEmailData } from "./brevoService";

interface AutomaticPaymentResult {
  processed: number;
  failed: number;
  details: Array<{
    paymentId: number;
    paymentName: string;
    amount: number;
    currency: string;
    type: PaymentType;
    status: 'success' | 'failed';
    error?: string;
    transactionId?: number;
  }>;
}

export default class AutomaticPaymentService {
  private prisma: PrismaClient;
  private transactionRepo: TransactionRepository;
  private brevoService: BrevoEmailService;
  private senderEmail: string;
  private senderName: string;

  constructor() {
    this.prisma = new PrismaClient();
    this.transactionRepo = new TransactionRepository();
    this.brevoService = new BrevoEmailService(process.env.BREVO_API_KEY!);
    this.senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@yourfinanceapp.com";
    this.senderName = process.env.BREVO_SENDER_NAME || "Your Finance App";
  }

  async processAutomaticPayments(): Promise<AutomaticPaymentResult> {
    const results: AutomaticPaymentResult = {
      processed: 0,
      failed: 0,
      details: [],
    };

    try {
      const duePayments = await this.prisma.recurringFundAndBill.findMany({
        where: {
          isActive: true,
          automaticAddition: true,
          deletedAt: null,
          nextExecution: {
            lte: new Date(),
          },
        },
        include: {
          account: true,
          user: true,
          categories: {
            include: {
              customCategory: true,
            },
            where: {
              deletedAt: null,
            },
          },
        },
      });

      console.log(`💰 Found ${duePayments.length} automatic payments to process`);

      for (const payment of duePayments) {
        try {
          const categoryIds = payment.categories.map(cat => cat.customCategoryId);
          let transactionId: number;

          if (payment.type === PaymentType.EXPENSE) {
            const transaction = await this.transactionRepo.executeRecurringPayment(
              payment.user[0].id,
              payment.id,
              payment.amount,
              payment.currency,
              payment.accountId,
              payment.name,
              payment.description,
              categoryIds.length > 0 ? categoryIds : null
            );
            transactionId = transaction.id;
          } else {
            const transaction = await this.transactionRepo.executeRecurringIncome(
              payment.user[0].id,
              payment.id,
              payment.amount,
              payment.currency,
              payment.accountId,
              payment.name,
              payment.description,
              categoryIds.length > 0 ? categoryIds : null
            );
            transactionId = transaction.id;
          }

          results.processed++;
          results.details.push({
            paymentId: payment.id,
            paymentName: payment.name,
            amount: payment.amount,
            currency: payment.currency,
            type: payment.type,
            status: 'success',
            transactionId: transactionId,
          });

          try {
            const user = payment.user[0];
            await this.sendPaymentConfirmationEmail(payment, user, transactionId);
            console.log(`📧 Confirmation email sent for ${payment.type.toLowerCase()}: ${payment.name}`);
          } catch (emailError) {
            console.error(`⚠️ Failed to send confirmation email for ${payment.name}:`, emailError);
          }

          console.log(`✅ Processed automatic ${payment.type.toLowerCase()}: ${payment.name} for amount: ${payment.amount} ${payment.currency}`);

        } catch (error) {
          results.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          results.details.push({
            paymentId: payment.id,
            paymentName: payment.name,
            amount: payment.amount,
            currency: payment.currency,
            type: payment.type,
            status: 'failed',
            error: errorMessage,
          });

          console.error(`❌ Failed to process automatic ${payment.type.toLowerCase()} ${payment.name} (ID: ${payment.id}):`, errorMessage);
        }
      }

      console.log(`🎯 Automatic payments processing completed: ${results.processed} processed, ${results.failed} failed`);
      return results;

    } catch (error) {
      console.error("❌ Error in processAutomaticPayments:", error);
      throw error;
    }
  }

  private async sendPaymentConfirmationEmail(payment: any, user: any, transactionId: number): Promise<void> {
    const isIncome = payment.type === PaymentType.INCOME;
    const themeColor = isIncome ? '#28a745' : '#dc3545';
    const bgColor = isIncome ? '#e8f5e8' : '#ffeaea';
    const icon = isIncome ? '💰' : '💸';
    const actionText = isIncome ? 'received in' : 'deducted from';
    const typeText = isIncome ? 'Income' : 'Expense';

    const categoryNames = payment.categories
      .map((cat: any) => cat.customCategory.name)
      .join(', ') || 'Uncategorized';

    const emailData: TransactionalEmailData = {
      sender: { 
        name: this.senderName, 
        email: this.senderEmail 
      },
      to: [{ 
        email: user.email, 
        name: `${user.firstName} ${user.lastName}` 
      }],
      subject: `${icon} Automatic ${typeText} Processed - ${payment.name}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background-color: ${themeColor}; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 20px;">${icon} Automatic ${typeText} Processed</h1>
          </div>
          
          <div style="padding: 30px;">
            <h2 style="color: #333; margin-top: 0;">${payment.name}</h2>
            
            <div style="margin: 20px 0; padding: 20px; background-color: ${bgColor}; border-radius: 8px; border-left: 4px solid ${themeColor};">
              <p style="margin: 0; font-size: 16px; color: #333;">
                <strong>${isIncome ? '+' : '-'}${payment.amount} ${payment.currency}</strong> has been automatically ${actionText} your <strong>${payment.account.name}</strong> account.
              </p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Transaction ID:</td>
                <td style="padding: 10px 0; text-align: right; color: #666;">#${transactionId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Amount:</td>
                <td style="padding: 10px 0; text-align: right; color: ${themeColor}; font-weight: bold;">
                  ${isIncome ? '+' : '-'}${payment.amount} ${payment.currency}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Date:</td>
                <td style="padding: 10px 0; text-align: right;">
                  ${new Date().toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Account:</td>
                <td style="padding: 10px 0; text-align: right;">${payment.account.name}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Type:</td>
                <td style="padding: 10px 0; text-align: right;">${typeText}</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 0; font-weight: bold;">Categories:</td>
                <td style="padding: 10px 0; text-align: right;">${categoryNames}</td>
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

            <div style="margin: 30px 0; padding: 15px; background-color: #f0f8ff; border-radius: 5px;">
              <p style="margin: 0; color: #666;">
                <strong>💡 Note:</strong> This transaction was processed automatically based on your recurring ${payment.type.toLowerCase()} schedule.
              </p>
            </div>

            ${payment.nextExecution ? `
              <div style="margin: 20px 0; padding: 15px; background-color: #fff8e1; border-radius: 5px;">
                <p style="margin: 0; color: #666;">
                  <strong>📅 Next automatic ${payment.type.toLowerCase()}:</strong> ${new Date(payment.nextExecution).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            ` : ''}
          </div>
          
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #888; font-size: 12px;">
            <p style="margin: 0;">This is an automated confirmation for your recurring ${payment.type.toLowerCase()}.</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Your Finance App. All rights reserved.</p>
          </div>
        </div>
      `,
      textContent: `
${icon} Automatic ${typeText} Processed

${payment.name}
Transaction ID: #${transactionId}
Amount: ${isIncome ? '+' : '-'}${payment.amount} ${payment.currency}
Date: ${new Date().toLocaleDateString()}
Account: ${payment.account.name}
Type: ${typeText}
Categories: ${categoryNames}
Frequency: ${payment.frequency}
${payment.description ? `Description: ${payment.description}` : ''}

${isIncome ? '+' : '-'}${payment.amount} ${payment.currency} has been automatically ${actionText} your ${payment.account.name} account.

This transaction was processed automatically based on your recurring ${payment.type.toLowerCase()} schedule.
${payment.nextExecution ? `Next automatic ${payment.type.toLowerCase()}: ${new Date(payment.nextExecution).toLocaleDateString()}` : ''}
      `,
      tags: [`automatic-${payment.type.toLowerCase()}`, `transaction-${transactionId}`, payment.frequency.toLowerCase()]
    };

    await this.brevoService.sendTransactionalEmail(emailData);
  }
}