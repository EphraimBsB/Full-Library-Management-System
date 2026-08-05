import { Injectable, Inject, Logger } from '@nestjs/common';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { DataSource } from 'typeorm';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectQueue('book-loan') private bookLoanQueue: Queue,
    private dataSource: DataSource,
  ) {}

  getSystemHealth() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const cpuLoad = os.loadavg();

    return {
      status: 'ok',
      uptime: process.uptime(),
      osUptime: os.uptime(),
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usagePercentage: ((usedMem / totalMem) * 100).toFixed(2),
      },
      cpu: {
        loadAverage: cpuLoad,
        cores: os.cpus().length,
      },
      nodeVersion: process.version,
      platform: os.platform(),
      timestamp: new Date().toISOString(),
    };
  }

  async getLogs(
    type: 'error' | 'system' | 'combined' = 'combined',
    lines: number = 100,
  ) {
    const logDir = path.join(process.cwd(), 'logs');

    if (!fs.existsSync(logDir)) {
      return { logs: [], message: `Log directory not found.` };
    }

    // Find the most recent log file for the type
    const files = fs
      .readdirSync(logDir)
      .filter((file) => file.startsWith(type) && file.endsWith('.log'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(logDir, a));
        const statB = fs.statSync(path.join(logDir, b));
        return statB.mtime.getTime() - statA.mtime.getTime(); // sort descending
      });

    if (files.length === 0) {
      return { logs: [], message: `No log files of type ${type} found.` };
    }

    const logFile = path.join(logDir, files[0]);

    try {
      const fileContent = await fs.promises.readFile(logFile, 'utf-8');
      const allLines = fileContent
        .split('\n')
        .filter((line) => line.trim() !== '');
      const recentLines = allLines.slice(-lines);

      const parsedLogs = recentLines.map((line) => {
        try {
          return JSON.parse(line);
        } catch (e) {
          return { message: line, timestamp: new Date().toISOString() };
        }
      });

      return { logs: parsedLogs };
    } catch (error) {
      return { logs: [] };
    }
  }

  async clearCache() {
    await this.cacheManager.clear();
    this.logger.log('System Cache manually cleared by Administrator.');
    return { message: 'Cache successfully cleared.' };
  }

  async getQueueStats() {
    const jobCounts = await this.bookLoanQueue.getJobCounts();
    return {
      queue: 'book-loan',
      stats: jobCounts,
    };
  }

  async getDbStats() {
    let size = 'Unknown';
    try {
      const result = await this.dataSource.query(`
        SELECT table_schema "database",
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) "size_mb" 
        FROM information_schema.tables 
        GROUP BY table_schema;
      `);
      size = result[0]?.size_mb || 'Unknown';
    } catch (e) {
      console.error('Failed to get DB size', e);
    }

    return {
      status: this.dataSource.isInitialized ? 'Connected' : 'Disconnected',
      sizeMb: size,
      type: this.dataSource.options.type,
    };
  }

  async triggerBackup() {
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }

      // We perform a JSON dump of core tables because mysqldump is not globally available in the PATH
      const users = await this.dataSource.query('SELECT * FROM users');
      const books = await this.dataSource.query('SELECT * FROM books');

      const backupData = {
        timestamp: new Date().toISOString(),
        tables: {
          usersCount: users.length,
          booksCount: books.length,
        },
        users,
        books,
      };

      const fileName = `backup-${Date.now()}.json`;
      const filePath = path.join(backupDir, fileName);

      await fs.promises.writeFile(
        filePath,
        JSON.stringify(backupData, null, 2),
      );

      this.logger.log(`Database backup generated at ${filePath}`);
      return {
        message: `Backup triggered successfully. Saved as ${fileName} in the /backups folder.`,
      };
    } catch (error) {
      this.logger.error('Backup failed:', error);
      return {
        message: 'Failed to generate backup. Check server logs for details.',
      };
    }
  }

  async listBackups() {
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      return { backups: [] };
    }
    const files = fs
      .readdirSync(backupDir)
      .filter((file) => file.endsWith('.json'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(backupDir, a));
        const statB = fs.statSync(path.join(backupDir, b));
        return statB.mtime.getTime() - statA.mtime.getTime(); // sort descending
      });
    return { backups: files };
  }

  async restoreBackup(fileName: string) {
    const backupDir = path.join(process.cwd(), 'backups');
    const filePath = path.join(backupDir, fileName);

    if (!fs.existsSync(filePath)) {
      return { success: false, message: 'Backup file not found.' };
    }

    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    let backupData;
    try {
      backupData = JSON.parse(fileContent);
    } catch (e) {
      return { success: false, message: 'Invalid backup file format.' };
    }

    if (!backupData.users || !backupData.books) {
      return {
        success: false,
        message: 'Backup file is missing required tables.',
      };
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.warn(`Starting database restore from ${fileName}...`);
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

      // Clear existing records
      await queryRunner.query('DELETE FROM users');
      await queryRunner.query('DELETE FROM books');

      // Restore Users
      for (const user of backupData.users) {
        const keys = Object.keys(user);
        const columns = keys.map((k) => `\`${k}\``).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const values = Object.values(user);
        await queryRunner.query(
          `INSERT INTO users (${columns}) VALUES (${placeholders})`,
          values,
        );
      }

      // Restore Books
      for (const book of backupData.books) {
        const keys = Object.keys(book);
        const columns = keys.map((k) => `\`${k}\``).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const values = Object.values(book);
        await queryRunner.query(
          `INSERT INTO books (${columns}) VALUES (${placeholders})`,
          values,
        );
      }

      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
      await queryRunner.commitTransaction();
      this.logger.log(`Database successfully restored from ${fileName}`);

      return {
        success: true,
        message: `Successfully restored ${backupData.users.length} users and ${backupData.books.length} books.`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1'); // Ensure it's re-enabled even on fail
      this.logger.error(`Restore failed: ${error.message}`, error.stack);
      return { success: false, message: `Restore failed: ${error.message}` };
    } finally {
      await queryRunner.release();
    }
  }
}
