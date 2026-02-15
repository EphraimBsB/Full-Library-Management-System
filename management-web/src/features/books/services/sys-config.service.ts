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

  getSubjects: async (): Promise<Subject[]> => {
    return apiClient.get<Subject[]>('/subjects');
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
