import { apiClient } from '../../../core/network/api_client';
import type { Book } from '../../books/services/book.service';
import type { User } from '../../books/services/inhouse_usage.service';

export interface DashboardStats {
  totalCopies: number;
  availableCopies: number;
  totalUsers: number;
  activeLoans: number;
  overdueLoans: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  recentBooks: Book[];
  topRatedBooks: Book[];
  mostBorrowedBooks: Book[];
  pendingRequests: any[];
  recentOverdues: any[];
  activeUsers: User[];
}

export const DashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    return apiClient.get<DashboardSummary>('/dashboard/summary');
  },
};
