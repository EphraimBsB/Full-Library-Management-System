import { apiClient } from '../../../core/network/api_client';

export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Subject {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface BookType {
  id: number;
  name: string;
  description?: string;
}

export interface Source {
  id: number;
  name: string;
  supplier?: string;
}

export interface Location {
  id: number;
  name: string;
}

export interface Shelf {
  id: number;
  name: string;
  locationId: number;
}

export const SysConfigService = {
  getCategories: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/categories');
  },

  getSubjects: async (params: { page?: number; limit?: number; search?: string } = {}): Promise<any> => {
    // backend returns PaginatedResponseDto<Subject>; caller should unwrap
    const query = new URLSearchParams();
    if (params.page !== undefined) query.append('page', params.page.toString());
    if (params.limit !== undefined) query.append('limit', params.limit.toString());
    if (params.search) query.append('search', params.search);
    const url = '/subjects' + (query.toString() ? `?${query.toString()}` : '');
    return apiClient.get<any>(url);
  },

  getTypes: async (): Promise<BookType[]> => {
    return apiClient.get<BookType[]>('/types');
  },

  getSources: async (): Promise<Source[]> => {
    return apiClient.get<Source[]>('/sources');
  },

  getLocations: async (): Promise<Location[]> => {
    return apiClient.get<Location[]>('/locations');
  },

  getShelves: async (): Promise<Shelf[]> => {
    return apiClient.get<Shelf[]>('/shelves');
  },
};
