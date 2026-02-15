import { apiClient } from '../../../core/network/api_client';

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  description?: string;
  coverImageUrl?: string;
  category?: string;
  categories?: { id: number; name: string }[];
  subjects?: { id: number; name: string }[];
  type?: { id: number; name: string };
  publisher?: string;
  publicationYear: number;
  edition?: string;
  rating?: number;
  borrowCount?: number;
  availableCopies: number;
  totalCopies: number;
  ebookUrl?: string;
  source?: { id: number; name: string };
  ddc?: string;
  price?: string;
  location?: string;
  shelf?: string;
  metadata?: {
    averageRating: number;
    views: number;
    borrowCount?: number;
  };
  copies?: BookCopy[];
  createdAt: string;
}

export interface BookCopy {
  id: number;
  accessNumber: string;
  status: 'AVAILABLE' | 'BORROWED' | 'LOST' | 'DAMAGED' | 'IN_REPAIR';
  notes?: string;
}

export interface Borrower {
  user_id: number;
  name: string;
  roll_number: string;
  email: string;
  phone: string;
}

export interface CurrentBorrow {
  copy_id: number;
  copy_access_number: string;
  borrower: Borrower;
  borrowed_at: string;
  due_date: string;
  is_overdue: boolean;
}

export interface BorrowHistory {
  copy_id: number;
  copy_access_number: string;
  borrower: Borrower;
  borrowed_at: string;
  returned_at: string;
}

export interface QueueRequest {
  position: number;
  user_id: number;
  name: string;
  roll_number: string;
  email: string;
  phone: string;
  requested_at: string;
}

export interface BookDetails {
  book: Book;
  current_borrows: CurrentBorrow[];
  borrow_history: BorrowHistory[];
  queue_requests: QueueRequest[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface GetBooksParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subject?: string;
  status?: string;
  type?: string;
  minAvailable?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const BookService = {
  getBooks: async (params: GetBooksParams): Promise<PaginatedResponse<Book>> => {
    return apiClient.get<PaginatedResponse<Book>>('/books', { params });
  },
  
  getBookDetails: async (id: number): Promise<BookDetails> => {
    return apiClient.get<BookDetails>(`/books/${id}/details`);
  },

  deleteBook: async (id: number): Promise<void> => {
    return apiClient.delete(`/books/${id}`);
  },

  createBook: async (data: unknown): Promise<Book> => {
    return apiClient.post<Book>('/books', data);
  },

  updateBook: async (id: number, data: unknown): Promise<Book> => {
    return apiClient.patch<Book>(`/books/${id}`, data);
  },
  
  getRecentlyAdded: async (limit = 5) => {
    return BookService.getBooks({ sortBy: 'createdAt', sortOrder: 'desc', limit });
  },
  
  getTopRated: async (limit = 5) => {
    return BookService.getBooks({ sortBy: 'rating', sortOrder: 'desc', limit });
  },
  
  getMostBorrowed: async (limit = 5) => {
    return BookService.getBooks({ sortBy: 'borrowCount', sortOrder: 'desc', limit });
  },

  updateBookCopy: async (bookId: number, copyId: number, data: unknown): Promise<void> => {
    return apiClient.patch(`/books/${bookId}/copies/${copyId}`, data);
  }
};
