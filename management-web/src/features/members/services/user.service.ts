import { apiClient } from '../../../core/network/api_client';
import type { PaginatedResponse } from '../../books/services/book.service';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  rollNumber?: string;
  phoneNumber?: string;
  degree?: string;
  course?: string;
  avatarUrl?: string;
  isActive: boolean;
  joinDate: string;
  roleId: number;
  activeLoansCount: number;
  memberships?: Membership[];
}

export interface MembershipType {
  id: number;
  name: string;
  description?: string;
  maxBooks: number;
  loanDurationDays: number;
  finePerDay: number;
}

export interface Membership {
  id: number;
  status: 'active' | 'inactive' | 'expired';
  startDate: string;
  expiryDate: string;
  membershipType: MembershipType;
}

export interface UserProfileSummary {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  rollNumber: string | null;
  phoneNumber: string | null;
  program: string | null;
  role: string;
  joinedAt: string;
  expiryDate: string | null;
  membershipStatus: string;
  membershipType: string;
  stats: {
    borrow: {
      active: number;
      overdue: number;
      returned: number;
    };
    favoritesCount: number;
    notesCount: number;
  };
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const UserService = {
  getUsers: async (params: GetUsersParams): Promise<PaginatedResponse<User>> => {
    return apiClient.get<PaginatedResponse<User>>('/users', { params });
  },

  getUser: async (id: string): Promise<User> => {
    return apiClient.get<User>(`/users/${id}`);
  },

  getProfileSummary: async (id: string): Promise<UserProfileSummary> => {
    return apiClient.get<UserProfileSummary>(`/users/${id}/profile-summary`);
  },

  createMember: async (data: any): Promise<User> => {
    return apiClient.post<User>('/users/member', data);
  },

  updateUser: async (id: string, data: any): Promise<User> => {
    return apiClient.patch<User>(`/users/${id}`, data);
  },

  deleteUser: async (id: string): Promise<void> => {
    return apiClient.delete(`/users/${id}`);
  },

  activateUser: async (id: string): Promise<void> => {
    return apiClient.post(`/users/${id}/activate`);
  },

  deactivateUser: async (id: string): Promise<void> => {
    return apiClient.post(`/users/${id}/deactivate`);
  },

  getMembershipTypes: async (): Promise<MembershipType[]> => {
    return apiClient.get<MembershipType[]>('/memberships/types');
  }
};
