"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const brevoService_1 = __importDefault(require("./brevoService"));
class LoginEmailService {
    brevoService;
    senderEmail;
    senderName;
    constructor() {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            throw new Error("BREVO_API_KEY environment variable is required");
        }
        this.brevoService = new brevoService_1.default(apiKey);
        this.senderEmail = process.env.SENDER_EMAIL || "noreply@financeapp.com";
        this.senderName = process.env.SENDER_NAME || "Finance App";
    }
    async sendLoginNotification(data) {
        try {
            const emailData = {
                sender: {
                    name: this.senderName,
                    email: this.senderEmail,
                },
                to: [
                    {
                        email: data.userEmail,
                        name: data.userName,
                    },
                ],
                subject: "New Login to Your Finance App Account",
                htmlContent: this.generateLoginEmailHTML(data),
                textContent: this.generateLoginEmailText(data),
                tags: ["login-notification"],
            };
            await this.brevoService.sendTransactionalEmail(emailData);
            console.log(`Login notification email sent to ${data.userEmail}`);
        }
        catch (error) {
            console.error("Failed to send login notification email:", error);
            // Don't throw error to avoid breaking the login flow
        }
    }
    generateLoginEmailHTML(data) {
        const loginTime = data.loginTime.toLocaleString();
        const ipInfo = data.ipAddress
            ? `<p><strong>IP Address:</strong> ${data.ipAddress}</p>`
            : "";
        const userAgentInfo = data.userAgent
            ? `<p><strong>Device:</strong> ${data.userAgent}</p>`
            : "";
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Login Notification</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .content { background-color: #ffffff; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px; }
          .footer { margin-top: 20px; font-size: 12px; color: #6c757d; }
          .alert { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 New Login Notification</h2>
          </div>
          
          <div class="content">
            <div class="alert">
              <strong>Hello ${data.userName},</strong><br>
              We detected a new login to your Finance App account.
            </div>
            
            <h3>Login Details:</h3>
            <p><strong>Time:</strong> ${loginTime}</p>
            ${ipInfo}
            ${userAgentInfo}
            
            <p>If this was you, you can safely ignore this email. If you don't recognize this login, please contact our support team immediately.</p>
            
            <p>Thank you for using Finance App!</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from Finance App. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }
    generateLoginEmailText(data) {
        const loginTime = data.loginTime.toLocaleString();
        const ipInfo = data.ipAddress ? `IP Address: ${data.ipAddress}\n` : "";
        const userAgentInfo = data.userAgent ? `Device: ${data.userAgent}\n` : "";
        return `
New Login Notification

Hello ${data.userName},

We detected a new login to your Finance App account.

Login Details:
Time: ${loginTime}
${ipInfo}${userAgentInfo}
If this was you, you can safely ignore this email. If you don't recognize this login, please contact our support team immediately.

Thank you for using Finance App!

---
This is an automated message from Finance App. Please do not reply to this email.
    `.trim();
    }
}
exports.default = LoginEmailService;
//# sourceMappingURL=loginEmailService.js.map