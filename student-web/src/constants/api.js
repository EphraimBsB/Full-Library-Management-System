// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY_STUDENT: '/auth/verify-student',
  REGISTER_STUDENT: '/auth/register-student',
  CHANGE_PASSWORD: '/auth/change-password',
  
  // Books
  BOOKS: '/books',
  BOOK_DETAILS: (id) => `/books/${id}/details`,
  BOOK_COPIES: (id) => `/books/${id}/copies`,
  
  // Subjects
  SUBJECTS: '/subjects',
  
  // Student specific
  STUDENT_DETAILS: '/student-details',
  PROFILE_SUMMARY: (userId) => `/users/${userId}/profile-summary`,
  UPDATE_PROFILE: (userId) => `/users/${userId}/profile`,
  BORROW_HISTORY: (userId) => `/users/${userId}/borrow-history`,
  FAVORITES: (userId) => `/users/${userId}/favorites`,
  NOTES: (userId) => `/users/${userId}/notes`,
  
  // Requests
  BOOK_REQUESTS: '/book-requests',
  MEMBERSHIP_REQUESTS: '/membership-requests',
  
  // In-house usage
  START_INHOUSE_USAGE: '/books/inhouse-usage/start',
  END_INHOUSE_USAGE: (id) => `/books/inhouse-usage/${id}/end`,
  ACTIVE_SESSIONS: '/books/inhouse-usage/all',
};

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Image headers for external images
export const IMAGE_HEADERS = {
  'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};
