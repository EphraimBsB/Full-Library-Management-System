import axios from 'axios';
import { API_BASE_URL, DEFAULT_HEADERS, API_ENDPOINTS } from '../constants/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: DEFAULT_HEADERS,
  timeout: 15000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// API Service class
export class ApiService {
  // In-house Usage
  static async checkInhouseNetwork() {
    try {
      const response = await api.get('/books/inhouse-usage/check-network');
      return response.data; // { allowed: boolean, message: string }
    } catch (error) {
      console.error('Error checking in-house network:', error);
      throw error;
    }
  }

  static async getActiveSession() {
    try {
      const response = await api.get('/books/inhouse-usage/history?status=active');
      return response.data;
    } catch (error) {
      console.error('Error getting active session:', error);
      throw error;
    }
  }

  static async startInhouseUsage(bookId, copyId) {
    try {
      const response = await api.post('/books/inhouse-usage/start', {
        bookId,
        copyId,
      });
      return response.data;
    } catch (error) {
      console.error('Error starting in-house usage:', error);
      throw error;
    }
  }

  static async endInhouseUsage(sessionId) {
    try {
      const response = await api.post(`/books/inhouse-usage/${sessionId}/end`);
      return response.data;
    } catch (error) {
      console.error('Error ending in-house usage:', error);
      throw error;
    }
  }

  static async forceEndInhouseUsage(sessionId) {
    try {
      const response = await api.post(`/books/inhouse-usage/${sessionId}/force-end`);
      return response.data;
    } catch (error) {
      console.error('Error force ending in-house usage:', error);
      throw error;
    }
  }

  static async getInhouseUsageCounts() {
    try {
      const response = await api.get('/books/inhouse-usage/counts');
      return response.data;
    } catch (error) {
      console.error('Error getting in-house usage counts:', error);
      throw error;
    }
  }

  static async getBookDetails(bookId) {
    try {
      const response = await api.get(`/books/${bookId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error getting book details:', error);
      throw error;
    }
  }

  // Book Notes
  static async getBookNotes(bookId) {
    try {
      const response = await api.get(`/books/notes/book/${bookId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting book notes:', error);
      throw error;
    }
  }

  static async createBookNote(noteData) {
    try {
      const response = await api.post('/books/notes', noteData);
      return response.data;
    } catch (error) {
      console.error('Error creating book note:', error);
      throw error;
    }
  }

  static async updateBookNote(noteId, noteData) {
    try {
      const response = await api.put(`/books/notes/${noteId}`, noteData);
      return response.data;
    } catch (error) {
      console.error('Error updating book note:', error);
      throw error;
    }
  }

  static async deleteBookNote(noteId) {
    try {
      const response = await api.delete(`/books/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting book note:', error);
      throw error;
    }
  }

  static async getBookNote(noteId) {
    try {
      const response = await api.get(`/books/notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting book note:', error);
      throw error;
    }
  }

  // Authentication
  static async login(credentials) {
    console.log('Login request data:', credentials);
    try {
      // Send as JSON for simple login
      const response = await api.post('/auth/login', credentials, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      throw error;
    }
  }

  static async register(userData) {
    // Convert to URL-encoded form data to match Flutter app
    const formData = new URLSearchParams();
    formData.append('email', userData.email);
    formData.append('password', userData.password);
    formData.append('firstName', userData.firstName);
    formData.append('lastName', userData.lastName);
    if (userData.phoneNumber) {
      formData.append('phoneNumber', userData.phoneNumber);
    }
    if (userData.rollNumber) {
      formData.append('rollNumber', userData.rollNumber);
    }
    
    const response = await api.post('/auth/register', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  // Books
  static async getBooks(params = {}) {
    // Handle array parameters properly
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (Array.isArray(params[key])) {
        // Add each array item as separate parameter with proper encoding
        params[key].forEach(value => {
          searchParams.append(key, encodeURIComponent(value));
        });
      } else if (params[key] !== undefined) {
        searchParams.append(key, params[key]);
      }
    });
    
    const response = await api.get(`/books?${searchParams.toString()}`);
    return response.data;
  }

  // Subjects
  static async getSubjects(params = {}) {
    // Handle array parameters properly
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (Array.isArray(params[key])) {
        // Add each array item as separate parameter with proper encoding
        params[key].forEach(value => {
          searchParams.append(key, encodeURIComponent(value));
        });
      } else if (params[key] !== undefined) {
        searchParams.append(key, params[key]);
      }
    });
    
    const response = await api.get(`${API_ENDPOINTS.SUBJECTS}?${searchParams.toString()}`);
    return response.data;
  }

  static async getBookCopies(id) {
    const response = await api.get(`/books/${id}/copies`);
    return response.data;
  }

  // Book Requests
  static async createBookRequest(requestData) {
    const response = await api.post('/book-requests', requestData);
    return response.data;
  }

  static async getPendingBookRequests() {
    const response = await api.get('/book-requests?status=PENDING');
    return response.data;
  }

  static async approveBookRequest(requestId, requestData) {
    const response = await api.post(`/book-requests/${requestId}/approve`, requestData);
    return response.data;
  }

  static async rejectBookRequest(requestId, requestData) {
    const response = await api.post(`/book-requests/${requestId}/reject`, requestData);
    return response.data;
  }

  // Renewal Requests
  static async createRenewalRequest(loanId, reason) {
    const response = await api.post('/book-requests/renewal', {
      loanId,
      reason: reason || 'Request for loan renewal'
    });
    return response.data;
  }

  // Student specific
  static async getStudentDetails(rollNumber) {
    const response = await api.get('/student-details', {
      params: { rollno: rollNumber }
    });
    return response.data;
  }

  static async getProfileSummary(userId) {
    const response = await api.get(`/users/${userId}/profile-summary`);
    return response.data;
  }

  static async getBorrowHistory(userId, params = {}) {
    const response = await api.get(`/users/${userId}/borrow-history`, { params });
    return response.data;
  }

  static async getFavorites(userId, params = {}) {
    const response = await api.get(`/users/${userId}/favorites`, { params });
    return response.data;
  }

  static async getUserNotes(userId, params = {}) {
    const response = await api.get(`/users/${userId}/notes`, { params });
    return response.data;
  }

  // Profile Management
  static async updateProfile(userId, profileData) {
    try {
      const response = await api.patch(`/users/profile`, profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  static async changePassword(passwordData) {
    try {
      const response = await api.post('/users/change-password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  }

  // Reading History (In-house usage)
  static async getReadingHistory(userId, params = {}) {
    const response = await api.get(`/books/inhouse-usage/history`, { params });
    return response.data;
  }

  static async getReadingHistoryByStatus(status, params = {}) {
    const response = await api.get(`/books/inhouse-usage/history`, { 
      params: { 
        status, 
        ...params 
      } 
    });
    return response.data;
  }

  // Book Requests
  static async getMyBookRequests() {
    const response = await api.get('/book-requests/my-requests');
    return response.data;
  }

  // Requests
  static async createBookRequest(requestData) {
    const response = await api.post('/book-requests', requestData);
    return response.data;
  }

  static async createMembershipRequest(requestData) {
    const response = await api.post('/membership-requests', requestData);
    return response.data;
  }

  // In-house usage
  static async getActiveSessions() {
    const response = await api.get('/books/inhouse-usage/all');
    return response.data;
  }

  // Password Reset
  static async forgotPassword(email) {
    const response = await api.post('/users/forgot-password', { email });
    return response.data;
  }

  static async resetPassword(resetData) {
    const response = await api.post('/users/reset-password', resetData);
    return response.data;
  }
}

// Image helper function
export const getImageUrl = (imageUrl) => {
  if (!imageUrl) return '/assets/default-book.jpg';
  
  // For external images, return directly (React doesn't have Flutter Web CORS issues)
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // For relative images, construct full URL
  if (imageUrl.startsWith('/')) {
    return `${API_BASE_URL.replace('/api/v1', '')}${imageUrl}`;
  }
  
  return imageUrl;
};

export default api;
