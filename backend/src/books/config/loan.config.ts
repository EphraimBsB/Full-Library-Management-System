import { registerAs } from '@nestjs/config';

export default registerAs('loan', () => ({
  loanPeriodDays: parseInt(process.env.LOAN_PERIOD_DAYS || '14'),
  maxLoansPerUser: parseInt(process.env.MAX_LOANS_PER_USER || '5'),
  renewalDays: parseInt(process.env.RENEWAL_DAYS || '7'),
  maxRenewals: parseInt(process.env.MAX_RENEWALS || '2'),
  dailyFineAmount: parseFloat(process.env.DAILY_FINE_AMOUNT || '1.00'),
  renewalCooldownHours: 24, // 24 hours between renewals
  overdueCheckBatchSize: 50, // Number of overdue loans to process in a batch
  cacheTtl: 300, // 5 minutes cache TTL
}));
