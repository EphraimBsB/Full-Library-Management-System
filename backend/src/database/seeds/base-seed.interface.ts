import { DataSource } from 'typeorm';

export interface ISeeder {
  run(dataSource: DataSource): Promise<any>;
}

export interface SeedResult {
  entity: string;
  count: number;
  details?: Record<string, any>;
  error?: string;
}
