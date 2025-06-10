import axios, { AxiosInstance, AxiosResponse } from 'axios';

interface EmailSender {
  name: string;
  email: string;
}

interface EmailRecipient {
  email: string;
  name?: string;
}

interface TransactionalEmailData {
  sender: EmailSender;
  to: EmailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, any>;
  tags?: string[];
}

interface BrevoEmailResponse {
  messageId: string;
}

interface ContactData {
  email: string;
  attributes?: Record<string, any>;
  listIds?: number[];
  updateEnabled?: boolean;
}

interface BrevoApiError {
  code: string;
  message: string;
}

class BrevoEmailService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Brevo API key is required');
    }
    
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.brevo.com/v3',
      headers: {
        'accept': 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
  }

  async sendTransactionalEmail(emailData: TransactionalEmailData): Promise<BrevoEmailResponse> {
    try {
      const response: AxiosResponse<BrevoEmailResponse> = await this.client.post('/smtp/email', {
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
    } catch (error: any) {
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

  async addContact(contactData: ContactData): Promise<any> {
    try {
      const response = await this.client.post('/contacts', {
        email: contactData.email,
        attributes: contactData.attributes,
        listIds: contactData.listIds,
        updateEnabled: contactData.updateEnabled ?? true
      });
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error adding contact to Brevo:', errorMessage);
      throw new Error(`Failed to add contact: ${errorMessage}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/account');
      return true;
    } catch (error) {
      console.error('Brevo connection test failed:', error);
      return false;
    }
  }
}

export default BrevoEmailService;
export type { TransactionalEmailData, EmailSender, EmailRecipient, BrevoEmailResponse, ContactData };