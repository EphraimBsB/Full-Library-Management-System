import { apiClient } from '../../../core/network/api_client';
import type { Book } from './book.service';

export const InhouseUsageStatus = {
  active: 'active',
  completed: 'completed',
  force_ended: 'force_ended',
} as const;

export type InhouseUsageStatus = typeof InhouseUsageStatus[keyof typeof InhouseUsageStatus];

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  degree?: string;
  borrowedBooks?: any[];
}

export interface InhouseUsage {
  id: string;
  bookId: string;
  userId: string;
  status: InhouseUsageStatus;
  startedAt: string;
  endedAt?: string;
  copy: {
      accessNumber: string;
      book: Book;
  };
  user: User;
}

export interface InhouseUsageListResponse {
    items: InhouseUsage[];
    count: number;
}

export const InhouseUsageService = {
  getAll: async (status?: string): Promise<InhouseUsageListResponse> => {
    return apiClient.get<InhouseUsageListResponse>('/books/inhouse-usage/all', { 
        params: { status } 
    });
  },

  getCounts: async (): Promise<Record<string, number>> => {
     return apiClient.get<Record<string, number>>('/books/inhouse-usage/counts');
  },

  forceEnd: async (id: string): Promise<any> => {
    return apiClient.post(`/books/inhouse-usage/${id}/force-end`);
  }
};
