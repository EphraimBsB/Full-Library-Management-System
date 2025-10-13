import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { User } from '../users/entities/user.entity';
import { Book } from '../books/entities/book.entity';
import { BookRequest } from 'src/books/entities/book-request.entity';
import { BookLoan } from 'src/books/entities/book-loan.entity';

@Injectable()
export class EmailService implements OnModuleInit {
  private transporter: nodemailer.Transporter | null = null;
  private templateDir: string;
  private templates: { [key: string]: HandlebarsTemplateDelegate } = {};

  constructor(private configService: ConfigService) {
    this.templateDir = path.join(process.cwd(), 'src/emails/templates');
  }

  onModuleInit() {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    try {
      const host = this.configService.get<string>('SMTP_HOST', 'smtp-relay.brevo.com');
      const port = parseInt(this.configService.get<string>('SMTP_PORT', '587'), 10);
      const secure = this.configService.get<string | boolean>('SMTP_SECURE', 'false').toString() === 'true';
      const user = this.configService.get<string>('SMTP_USER');
      const pass = this.configService.get<string>('SMTP_PASSWORD');

      if (!user || !pass) {
        console.warn('SMTP credentials not fully configured. Email sending will be disabled.');
        return;
      }

      // Log partial config for debugging (without password)
      // console.log('Initializing email transporter with config:', {
      //   host,
      //   port,
      //   secure,
      //   user,
      //   pass: pass ? '***' : 'not set'
      // });

      // Check if we should use the first password or the xkeysib format
      const useXKeySib = pass.startsWith('xkeysib-');
      
      const transporterConfig: any = {
        host,
        port,
        secure: false, // Always false for Brevo with port 587
        auth: {
          user,
          pass: useXKeySib ? pass : pass
        },
        tls: {
          rejectUnauthorized: false,
          minVersion: 'TLSv1.2'
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
        logger: true,
        debug: true
      };

      // Special handling for xkeysib format
      if (useXKeySib) {
        transporterConfig.authMethod = 'PLAIN';
      }

      this.transporter = nodemailer.createTransport(transporterConfig);
      
      // Add event listeners for better debugging
      this.transporter.on('token', (token) => {
        console.log('SMTP Auth token:', token);
      });

    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      this.transporter = null;
    }
  }

  private loadTemplates() {
    const templateFiles = fs.readdirSync(this.templateDir);
    
    templateFiles.forEach(file => {
      if (file.endsWith('.hbs')) {
        const templateName = path.basename(file, '.hbs');
        const templatePath = path.join(this.templateDir, file);
        const templateSource = fs.readFileSync(templatePath, 'utf8');
        this.templates[templateName] = handlebars.compile(templateSource);
      }
    });
  }

  async sendEmail(to: string, subject: string, templateName: string, context: any = {}) {
    if (!this.transporter) {
      throw new Error('Email service is not properly configured. SMTP transporter is not initialized.');
    }

    try {
      const template = this.templates[templateName];
      if (!template) {
        throw new Error(`Template ${templateName} not found. Available templates: ${Object.keys(this.templates).join(', ')}`);
      }

      // Ensure we have all required context for the templates
      const emailContext = {
        ...context,
        title: subject,
        currentYear: new Date().getFullYear(),
        appName: this.configService.get<string>('APP_NAME', 'Library Management System'),
        supportEmail: this.configService.get<string>('SUPPORT_EMAIL', 'support@yourlibrary.com'),
      };

      // Render the template with the context
      const html = template(emailContext);

      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM', 'noreply@example.com'),
        to,
        subject,
        html,
        // Add message-id and date headers for better email deliverability
        headers: {
          'X-Library-System': 'ISBAT-LMS',
          'X-Auto-Response-Suppress': 'OOF, AutoReply',
        },
      };

      console.log('Sending email with options:', {
        to,
        subject,
        from: mailOptions.from,
        template: templateName
      });

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Message sent successfully. Message ID:', info.messageId);
      return info;
    } catch (error) {
      const errorDetails = {
        error: error.message,
        code: error.code,
        command: error.command,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        to,
        subject,
        template: templateName
      };
      
      console.error('Error sending email:', JSON.stringify(errorDetails, null, 2));
      
      // More specific error messages based on error code
      if (error.code === 'EAUTH') {
        throw new Error('Authentication failed. Please check your SMTP credentials.');
      } else if (error.code === 'ECONNECTION') {
        throw new Error('Could not connect to the SMTP server. Please check your network connection and SMTP settings.');
      } else if (error.code === 'EENVELOPE') {
        throw new Error('Invalid email address or message format.');
      }
      
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendBorrowRequestEmail(user: User, book: Book, request: BookRequest) {
    await this.sendEmail(
      user.email,
      `Borrow Request: ${book.title}`,
      'borrow-request',
      {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
        book: {
          title: book.title,
          author: book.author,
          isbn: book.isbn,
        },
        request: {
          id: request.id,
          createdAt: request.createdAt.toLocaleDateString(),
        },
      },
    );
  }

  async sendBookIssuedEmail(user: User, book: Book, request: BookLoan) {
    if (!request.dueDate) return;

    await this.sendEmail(
      user.email,
      `Book Issued: ${book.title}`,
      'book-issued',
      {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
        book: {
          title: book.title,
          author: book.author,
          isbn: book.isbn,
        },
        request: {
          accessNumber: request.bookCopy.accessNumber,
          dueDate: request.dueDate.toLocaleDateString(),
        },
      },
    );
  }

  async sendQueueUpdateEmail(user: User, book: Book, position: number) {
    await this.sendEmail(
      user.email,
      `Update on Your Request for: ${book.title}`,
      'queue-update',
      {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
        },
        book: {
          title: book.title,
          author: book.author,
        },
        position,
      },
    );
  }
}
