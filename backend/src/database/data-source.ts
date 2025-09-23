import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: configService.get('DB_HOST', 'localhost'),
  port: parseInt(configService.get('DB_PORT', '3306') as string, 10),
  username: configService.get('DB_USERNAME', 'root'),
  password: configService.get('DB_PASSWORD', ''),
  database: configService.get('DB_DATABASE', 'library_db'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // Enable this only for development
  logging: configService.get('NODE_ENV') === 'development',
  charset: 'utf8mb4',
  timezone: 'Z',
  connectTimeout: 10000,
  acquireTimeout: 10000,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
