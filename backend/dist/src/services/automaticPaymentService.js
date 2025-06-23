"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const transactionRepository_1 = require("../repositories/transactionRepository");
const brevoService_1 = __importDefault(require("./brevoService"));
class AutomaticPaymentService {
    prisma;
    transactionRepo;
    brevoService;
    senderEmail;
    senderName;
    constructor() {
        this.prisma = new client_1.PrismaClient();
        this.transactionRepo = new transactionRepository_1.TransactionRepository();
        this.brevoService = new brevoService_1.default(process.env.BREVO_API_KEY);
        this.senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@yourfinanceapp.com";
        this.senderName = process.env.BREVO_SENDER_NAME || "Your Finance App";
    }
    async processAutomaticPayments() {
        const results = {
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
            for (const payment of duePayments) {
                try {
                    const categoryIds = payment.categories.map(cat => cat.customCategoryId);
                    let transactionId;
                    if (payment.type === client_1.PaymentType.EXPENSE) {
                        const transaction = await this.transactionRepo.executeRecurringPayment(payment.user[0].id, payment.id, payment.amount, payment.currency, payment.accountId, payment.name, payment.description, categoryIds.length > 0 ? categoryIds : null);
                        transactionId = transaction.id;
                    }
                    else {
                        const transaction = await this.transactionRepo.executeRecurringIncome(payment.user[0].id, payment.id, payment.amount, payment.currency, payment.accountId, payment.name, payment.description, categoryIds.length > 0 ? categoryIds : null);
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
                    }
                    catch (emailError) {
                        console.error(`Failed to send confirmation email for ${payment.name}:`, emailError);
                    }
                }
                catch (error) {
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
                    console.error(`Failed to process automatic ${payment.type.toLowerCase()} ${payment.name} (ID: ${payment.id}):`, errorMessage);
                }
            }
            return results;
        }
        catch (error) {
            console.error("Error in processAutomaticPayments:", error);
            throw error;
        }
    }
    async sendPaymentConfirmationEmail(payment, user, transactionId) {
        const isIncome = payment.type === client_1.PaymentType.INCOME;
        const themeColor = isIncome ? '#28a745' : '#dc3545';
        const bgColor = isIncome ? '#e8f5e8' : '#ffeaea';
        const icon = isIncome ? '💰' : '💸';
        const actionText = isIncome ? 'received in' : 'deducted from';
        const typeText = isIncome ? 'Income' : 'Expense';
        const categoryNames = payment.categories
            .map((cat) => cat.customCategory.name)
            .join(', ') || 'Uncategorized';
        const emailData = {
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

            ${payment.nextExecution && payment.frequency !== 'ONCE' ? `
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

            ${payment.frequency === 'ONCE' ? `
              <div style="margin: 20px 0; padding: 15px; background-color: #e8f4fd; border-radius: 5px;">
                <p style="margin: 0; color: #666;">
                  <strong>✅ One-time payment:</strong> This was a one-time automatic ${payment.type.toLowerCase()} and will not repeat.
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
exports.default = AutomaticPaymentService;
//# sourceMappingURL=automaticPaymentService.js.map