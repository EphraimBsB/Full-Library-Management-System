import { apiClient } from '../../../core/network/api_client';

export interface BookSearchResult {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  coverImageUrl?: string;
  category: string;
  availabilityStatus: string;
  availableCopies?: number; // Added for transformation
}

export interface MemberSearchResult {
  id: string; // Changed from number to string to match User.id
  firstName: string;
  lastName: string;
  rollNumber: string;
  email: string;
  degree?: string;
  currentBorrowedBooks: number;
  activeLoansCount?: number; // Added for transformation
}

export interface SearchResults {
  books: BookSearchResult[];
  members: MemberSearchResult[];
  hasMore?: {
    books: boolean;
    members: boolean;
  };
}

interface ApiResponse<T> {
  data: T;
  success?: boolean;
  message?: string;
}

export interface SearchFilters {
  entity: 'all' | 'books' | 'members';
}

export class SearchService {
  static async searchBooks(query: string, filters?: SearchFilters, limit: number = 5): Promise<BookSearchResult[]> {
    try {
      // Use the same endpoint as BooksPage - GET /books with search parameter
      void filters; // Parameter kept for future advanced filtering
      const response = await apiClient.get('/books', {
        params: { search: query, limit, page: 1 }
      }) as ApiResponse<BookSearchResult[]>;

      // Transform the response to match our expected format
      // API returns {data: [...], total: ..., page: ...} so data is the array directly
      const books = response.data || [];

      return books.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        coverImageUrl: book.coverImageUrl,
        category: book.category || 'Uncategorized',
        availabilityStatus: book.availableCopies && book.availableCopies > 0 ? 'Available' : 'Unavailable',
        availableCopies: book.availableCopies
      }));
    } catch (error) {
      console.error('Error searching books:', error);
      return [];
    }
  }

  static async searchMembers(query: string, filters?: SearchFilters, limit: number = 5): Promise<MemberSearchResult[]> {
    try {
      // Use the same endpoint as MembersPage - GET /users with search parameter
      void filters; // Parameter kept for future advanced filtering
      const response = await apiClient.get('/users', {
        params: { search: query }
      }) as ApiResponse<MemberSearchResult[]>;

      // Transform the response to match our expected format and limit results
      // API returns {data: [...], total: ..., page: ...} so data is the array directly
      const members = response.data || [];

      return members.slice(0, limit).map(member => ({
        id: member.id, // Keep as string, don't convert to number
        firstName: member.firstName,
        lastName: member.lastName,
        rollNumber: member.rollNumber || '',
        email: member.email,
        degree: member.degree,
        currentBorrowedBooks: member.activeLoansCount || 0,
        activeLoansCount: member.activeLoansCount
      }));
    } catch (error) {
      console.error('Error searching members:', error);
      return [];
    }
  }

  static async searchAll(query: string, filters: SearchFilters = { entity: 'all' }, limit: number = 5): Promise<SearchResults> {
    const shouldSearchBooks = filters.entity === 'all' || filters.entity === 'books';
    const shouldSearchMembers = filters.entity === 'all' || filters.entity === 'members';

    const [books, members] = await Promise.allSettled([
      shouldSearchBooks ? this.searchBooks(query, filters, limit) : Promise.resolve([]),
      shouldSearchMembers ? this.searchMembers(query, filters, limit) : Promise.resolve([])
    ]);

    return {
      books: books.status === 'fulfilled' ? books.value : [],
      members: members.status === 'fulfilled' ? members.value : [],
      hasMore: {
        books: shouldSearchBooks && books.status === 'fulfilled' && books.value.length === limit,
        members: shouldSearchMembers && members.status === 'fulfilled' && members.value.length === limit
      }
    };
  }
}
