// src/data-import/dto/import-result.dto.ts
export class ImportResultDto {
  row: number;
  title?: string;
  success: boolean;
  errors?: string[];
  createdId?: number;
  data?: Record<string, any>;
}

export class ImportSummaryDto {
  total: number;
  imported: number;
  failed: number;
  results: ImportResultDto[];
  errors: string[];
  warnings: string[];
  duration: number;
  timestamp: Date;
}
