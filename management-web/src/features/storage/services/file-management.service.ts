import { apiClient } from '../../../core/network/api_client';

export interface FileRecord {
  id: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  metadata: any;
  userId: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  url: string;
}

export interface FileManagementQuery {
  page?: number;
  limit?: number;
  search?: string;
  mimeType?: string;
  isPublic?: boolean;
  userId?: string;
  sortBy?: 'createdAt' | 'size' | 'originalName' | 'mimeType';
  sortOrder?: 'ASC' | 'DESC';
}

export interface FileManagementResponse {
  data: FileRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  sizeByType: Record<string, number>;
  recentUploads: FileRecord[];
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
}

export interface UpdateFileDto {
  originalName?: string;
  isPublic?: boolean;
}

export interface BatchDeleteDto {
  fileIds: string[];
}

export interface BatchDeleteResponse {
  message: string;
  deletedCount: number;
  errors: string[];
}

export interface CleanupResponse {
  message: string;
  deletedCount: number;
  freedSpace: number;
}

export interface SyncStatusResponse {
  totalFilesInStorage: number;
  totalFilesInDatabase: number;
  orphanedFiles: number;
  storageSize: number;
}

export interface SyncResponse {
  message: string;
  foundFiles: number;
  syncedFiles: number;
  errors: string[];
}

class FileManagementService {
  private baseUrl = '/file-management';

  async getFiles(query: FileManagementQuery = {}): Promise<FileManagementResponse> {
    const response = await apiClient.get<FileManagementResponse>(this.baseUrl, { params: query });
    return response;
  }

  async getStorageStats(): Promise<StorageStats> {
    const response = await apiClient.get<StorageStats>(`${this.baseUrl}/stats`);
    return response;
  }

  async getFileById(id: string): Promise<FileRecord> {
    const response = await apiClient.get<FileRecord>(`${this.baseUrl}/${id}`);
    return response;
  }

  async updateFile(id: string, data: UpdateFileDto): Promise<FileRecord> {
    const response = await apiClient.patch<FileRecord>(`${this.baseUrl}/${id}`, data);
    return response;
  }

  async deleteFile(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`${this.baseUrl}/${id}`);
    return response;
  }

  async batchDeleteFiles(fileIds: string[]): Promise<BatchDeleteResponse> {
    const response = await apiClient.post<BatchDeleteResponse>(`${this.baseUrl}/batch-delete`, { fileIds });
    return response;
  }

  async cleanupOrphanedFiles(): Promise<CleanupResponse> {
    const response = await apiClient.post<CleanupResponse>(`${this.baseUrl}/cleanup`);
    return response;
  }

  async getSyncStatus(): Promise<SyncStatusResponse> {
    const response = await apiClient.get<SyncStatusResponse>(`${this.baseUrl}/sync-status`);
    return response;
  }

  async syncOrphanedFiles(): Promise<SyncResponse> {
    const response = await apiClient.post<SyncResponse>(`${this.baseUrl}/sync`);
    return response;
  }

  // Helper method to format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Helper method to get file type icon
  getFileTypeIcon(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'picture_as_pdf';
    if (mimeType.includes('word')) return 'description';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'table_chart';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'slideshow';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    if (mimeType.includes('text')) return 'text_snippet';
    return 'insert_drive_file';
  }

  // Helper method to get file type category
  getFileTypeCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('epub')) return 'ebook';
    if (mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('powerpoint')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
    return 'other';
  }
}

export const fileManagementService = new FileManagementService();
