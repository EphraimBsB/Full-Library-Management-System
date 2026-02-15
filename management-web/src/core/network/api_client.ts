import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_CONFIG } from '../config/api';
import { TokenStorage } from '../utils/token_storage';
import { useAuthStore } from '../hooks/useAuth';
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ValidationException,
  ServerException,
  ApiException,
  NetworkException,
} from './api_exceptions';

// Queue for failed requests during token refresh
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = TokenStorage.getToken();
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response Interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle Network Errors
        if (!error.response) {
          return Promise.reject(new NetworkException(error.message));
        }

        // Handle Token Refresh (401)
        if (error.response.status === 401 && !originalRequest._retry) {
          if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
             return Promise.reject(this.handleApiError(error));
          }

          if (isRefreshing) {
            return new Promise(function(resolve, reject) {
              failedQueue.push({ resolve, reject });
            }).then(token => {
              if (originalRequest.headers) {
                  originalRequest.headers['Authorization'] = 'Bearer ' + token;
              }
              return axios(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const refreshToken = TokenStorage.getRefreshToken();
             if (!refreshToken) {
                throw new Error("No refresh token");
             }
            
            // Note: We use a separate axios call to avoid interceptor loop
            const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, {
                refreshToken: refreshToken
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            
            TokenStorage.saveToken(accessToken);
            if (newRefreshToken) {
                TokenStorage.saveRefreshToken(newRefreshToken);
            }

            if (this.axiosInstance.defaults.headers.common) {
                this.axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
            }
            
            processQueue(null, accessToken);
            
            if (originalRequest.headers) {
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
            }
            
            return this.axiosInstance(originalRequest);
          } catch (err) {
            processQueue(err, null);
            useAuthStore.getState().logout();
            // Optional: Redirect to login page or emit event
            window.location.href = '/login'; 
            return Promise.reject(this.handleApiError(error));
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  private handleApiError(error: AxiosError): ApiException {
    const response = error.response;
    if (!response) {
      return new NetworkException(error.message);
    }

    const data = response.data as { message?: string; error?: string; errors?: unknown };
    const message = data?.message || data?.error || 'An error occurred';

    switch (response.status) {
      case 400:
        return new BadRequestException(message, data);
      case 401:
        return new UnauthorizedException(message, data);
      case 403:
        return new ForbiddenException(message, data);
      case 404:
        return new NotFoundException(message, data);
      case 422:
        return new ValidationException(message, (data?.errors as Record<string, unknown>) || {}, data);
      case 500:
        return new ServerException(message, data);
      default:
        return new ApiException(message, response.status, data);
    }
  }

  public get instance(): AxiosInstance {
    return this.axiosInstance;
  }

  // Helper methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    return response.data;
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
