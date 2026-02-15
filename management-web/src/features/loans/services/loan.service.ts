import { apiClient } from '../../../core/network/api_client';

export const LoanStatus = {
  ACTIVE: 'ACTIVE',
  BORROWED: 'BORROWED', 
  RETURNED: 'RETURNED',
  OVERDUE: 'OVERDUE',
  LOST: 'LOST',
  DAMAGED: 'DAMAGED'
} as const;

export type LoanStatus = typeof LoanStatus[keyof typeof LoanStatus];

export const BookRequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  QUEUED: 'QUEUED',
  FULFILLED: 'FULFILLED',
  CANCELLED: 'CANCELLED',
  RENEWAL_PENDING: 'RENEWAL_PENDING',
  RENEWAL_APPROVED: 'RENEWAL_APPROVED',
  RENEWAL_REJECTED: 'RENEWAL_REJECTED',
} as const;

export type BookRequestStatus = typeof BookRequestStatus[keyof typeof BookRequestStatus];

export interface BookCopy {
  id: number;
  accessNumber: string;
  bookId: number;
  status: string;
  book: {
    id: number;
    title: string;
    author: string;
    isbn: string;
    coverImageUrl?: string;
  };
}

export interface Loan {
  id: string;
  bookCopyId: number;
  userId: string;
  queueEntryId?: string;
  borrowedAt: string;
  dueDate: string;
  lastRenewedAt?: string;
  returnedAt?: string;
  fineAmount?: number;
  renewalCount: number;
  status: LoanStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  bookCopy?: BookCopy;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    rollNumber?: string;
    semester?: string;
  };
  returnedById?: string;
  requestId?: string;
}

export interface BookRequest {
  id?: string;
  userId?: string;
  bookId?: number;
  status?: BookRequestStatus;
  reason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  fulfilledAt?: string;
  queueEntryId?: string;
  approvedById?: string;
  rejectedById?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    rollNumber?: string;
    semester?: string;
  };
  book?: {
    id: number;
    title: string;
    author: string;
    isbn: string;
    coverImageUrl?: string;
    bookCopies?: BookCopy[];
    copies?: BookCopy[]; // Backend sends 'copies' in the response
  };
  loanId?: string;
  loan?: Loan;
  requestType?: string;
}

export interface CreateLoanDto {
  bookId: number;
  preferredCopyId?: number;
}

export interface IssueBookToUserDto {
  rollNumber: string;
  bookId?: number;
  accessNumber?: string; // Backend expects accessNumber field
}

export interface ApproveRejectRequestDto {
  preferredCopyId?: string; // Backend expects string, not number
  notes?: string;
}

export interface CreateRenewalRequestDto {
  loanId: string;
  reason?: string;
}

export interface ApproveRejectRenewalDto {
  reason?: string;
}

export interface LoanFilters {
  status?: LoanStatus;
  userId?: string;
  bookId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedLoansResponse {
  data: Loan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const LoanService = {
  // Loan Management
  getAllLoans: async (filters?: LoanFilters): Promise<PaginatedLoansResponse> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.bookId) params.append('bookId', filters.bookId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    return apiClient.get(`/loans?${params.toString()}`);
  },

  getLoanById: async (id: string): Promise<Loan> => {
    return apiClient.get(`/loans/${id}`);
  },

  issueBookToUser: async (data: IssueBookToUserDto): Promise<Loan> => {
    return apiClient.post('/loans/issue-to-user', data);
  },

  returnBook: async (loanId: string): Promise<Loan> => {
    return apiClient.post(`/loans/return/${loanId}`);
  },

  renewLoan: async (loanId: string): Promise<Loan> => {
    return apiClient.post(`/loans/renew/${loanId}`);
  },

  getMyLoans: async (): Promise<Loan[]> => {
    return apiClient.get('/loans/my-loans');
  },

  getOverdueLoans: async (): Promise<Loan[]> => {
    return apiClient.get('/loans/overdue');
  },

  checkOverdueLoans: async (): Promise<{ processed: number; errors: number }> => {
    return apiClient.post('/loans/check-overdue');
  },

  // Book Request Management
  getAllBookRequests: async (status?: BookRequestStatus): Promise<BookRequest[]> => {
    const params = status ? `?status=${status}` : '';
    return apiClient.get(`/book-requests${params}`);
  },

  getBookRequestById: async (id: string): Promise<BookRequest> => {
    return apiClient.get(`/book-requests/${id}`);
  },

  approveBookRequest: async (id: string, data: ApproveRejectRequestDto): Promise<BookRequest> => {
    return apiClient.post(`/book-requests/${id}/approve`, data);
  },

  rejectBookRequest: async (id: string, data: ApproveRejectRequestDto): Promise<BookRequest> => {
    return apiClient.post(`/book-requests/${id}/reject`, data);
  },

  cancelBookRequest: async (id: string): Promise<BookRequest> => {
    return apiClient.delete(`/book-requests/${id}`);
  },

  getMyBookRequests: async (): Promise<BookRequest[]> => {
    return apiClient.get('/book-requests/my-requests');
  },

  getBookRequests: async (bookId: string): Promise<BookRequest[]> => {
    return apiClient.get(`/book-requests/book/${bookId}`);
  },

  // Renewal Request Management
  createRenewalRequest: async (data: CreateRenewalRequestDto): Promise<BookRequest> => {
    return apiClient.post('/book-requests/renewal', data);
  },

  getRenewalRequests: async (status?: BookRequestStatus): Promise<BookRequest[]> => {
    const params = status ? `?status=${status}` : '';
    return apiClient.get(`/book-requests/renewal/all${params}`);
  },

  approveRenewalRequest: async (requestId: string, data: ApproveRejectRenewalDto): Promise<any> => {
    return apiClient.post(`/book-requests/renewal/${requestId}/approve`, data);
  },

  rejectRenewalRequest: async (requestId: string, data: ApproveRejectRenewalDto): Promise<BookRequest> => {
    return apiClient.post(`/book-requests/renewal/${requestId}/reject`, data);
  },
};
