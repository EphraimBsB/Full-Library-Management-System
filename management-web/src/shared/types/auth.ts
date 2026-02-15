export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Optional fallback
  rollNumber?: string;
  degree?: string;
  semester?: string;
  role?: {
    id: number;
    name: string;
    description: string;
    permissions: string[];
    isActive: boolean;
  };
  avatarUrl?: string;
  isActive: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
