export interface PaginationOptions {
  /** The current page number (1-based) */
  page?: number;
  
  /** Number of items per page */
  limit?: number;
  
  /** Optional search query string */
  search?: string;
  
  /** Optional sorting field */
  sortBy?: string;
  
  /** Sort direction: 'ASC' or 'DESC' */
  sortOrder?: 'ASC' | 'DESC';
}
