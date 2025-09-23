import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private readonly from: string | undefined;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {
    this.from = this.config.get<string>('SMTP_FROM');

    const host = this.config.get<string>('SMTP_HOST');
    const port = Number(this.config.get<string>('SMTP_PORT')) || 587;
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const secure = this.config.get<string>('SMTP_SECURE') === 'true';

    if (!host || !user || !pass) {
      this.logger.warn('Email disabled: SMTP_HOST/USER/PASS not configured');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  get isEnabled(): boolean {
    return !!this.transporter;
  }

  async send(options: { to: string; subject: string; text?: string; html?: string }) {
    if (!this.transporter) return;
    await this.transporter.sendMail({ from: this.from, ...options });
  }

  basicHtml(title: string, message: string): string {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background:#f6f7f9; margin:0; padding:24px; }
      .card { max-width: 560px; margin: 0 auto; background:#ffffff; border-radius:12px; box-shadow: 0 1px 3px rgba(0,0,0,.06); padding: 24px; }
      h1 { font-size: 20px; margin: 0 0 12px; color:#111827; }
      p { font-size: 14px; color:#374151; line-height: 1.6; }
      .footer { margin-top: 16px; font-size: 12px; color:#6b7280; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${message}</p>
      <div class="footer">This is an automated message from the Library System.</div>
    </div>
  </body>
 </html>`;
  }

  async sendToUser(userId: string, subject: string, text: string, html?: string) {
    if (!this.transporter) return;
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user?.email) return;
    await this.send({ to: user.email, subject, text, html });
  }
}
