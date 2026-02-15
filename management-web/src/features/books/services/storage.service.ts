import { apiClient } from '../../../core/network/api_client';

export interface FileResponse {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export const StorageService = {
  uploadFile: async (file: File, folder: string = 'books', isPublic: boolean = true): Promise<FileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    formData.append('isPublic', isPublic.toString());

    return apiClient.post<FileResponse>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
