"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class BrevoEmailService {
    client;
    apiKey;
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Brevo API key is required');
        }
        this.apiKey = apiKey;
        this.client = axios_1.default.create({
            baseURL: 'https://api.brevo.com/v3',
            headers: {
                'accept': 'application/json',
                'api-key': this.apiKey,
                'content-type': 'application/json'
            },
            timeout: 10000
        });
    }
    async sendTransactionalEmail(emailData) {
        try {
            const response = await this.client.post('/smtp/email', {
                sender: emailData.sender,
                to: emailData.to,
                subject: emailData.subject,
                htmlContent: emailData.htmlContent,
                textContent: emailData.textContent,
                templateId: emailData.templateId,
                params: emailData.params,
                tags: emailData.tags
            });
            return response.data;
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            const errorCode = error.response?.data?.code || 'UNKNOWN_ERROR';
            console.error('Brevo API Error:', {
                code: errorCode,
                message: errorMessage,
                status: error.response?.status,
                data: error.response?.data
            });
            throw new Error(`Failed to send email via Brevo: ${errorMessage}`);
        }
    }
    async addContact(contactData) {
        try {
            const response = await this.client.post('/contacts', {
                email: contactData.email,
                attributes: contactData.attributes,
                listIds: contactData.listIds,
                updateEnabled: contactData.updateEnabled ?? true
            });
            return response.data;
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            console.error('Error adding contact to Brevo:', errorMessage);
            throw new Error(`Failed to add contact: ${errorMessage}`);
        }
    }
    async testConnection() {
        try {
            await this.client.get('/account');
            return true;
        }
        catch (error) {
            console.error('Brevo connection test failed:', error);
            return false;
        }
    }
}
exports.default = BrevoEmailService;
//# sourceMappingURL=brevoService.js.map