export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      ME: '/auth/me',
    },
    BOOKS: {
      LIST: '/books',
      CREATE: '/books',
      UPDATE: '/books/:id',
      DELETE: '/books/:id',
      SEARCH: '/books/search',
    },
    LOANS: {
      LIST: '/loans',
      CREATE: '/loans',
      RETURN: '/loans/:id/return',
      RENEW: '/loans/:id/renew',
    },
    MEMBERS: {
      LIST: '/users',
      CREATE: '/users',
      UPDATE: '/users/:id',
      SEARCH: '/users/search',
    },
    CATEGORIES: {
      LIST: '/categories',
      CREATE: '/categories',
      UPDATE: '/categories/:id',
      DELETE: '/categories/:id',
    },
    SUBJECTS: {
      LIST: '/subjects',
      CREATE: '/subjects',
      UPDATE: '/subjects/:id',
      DELETE: '/subjects/:id',
    },
    BOOK_TYPES: {
      LIST: '/types',
      CREATE: '/types',
      UPDATE: '/types/:id',
      DELETE: '/types/:id',
    },
    PUBLISHERS: {
      LIST: '/publishers',
      CREATE: '/publishers',
      UPDATE: '/publishers/:id',
      DELETE: '/publishers/:id',
    },
    LOCATIONS: {
      LIST: '/locations',
      CREATE: '/locations',
      UPDATE: '/locations/:id',
      DELETE: '/locations/:id',
    },
    SHELVES: {
      LIST: '/shelves',
      CREATE: '/shelves',
      UPDATE: '/shelves/:id',
      DELETE: '/shelves/:id',
    },
    USER_ROLES: {
      LIST: '/user-roles',
      CREATE: '/user-roles',
      UPDATE: '/user-roles/:id',
      DELETE: '/user-roles/:id',
    },
    MEMBERSHIP_TYPES: {
      LIST: '/membership-types',
      CREATE: '/membership-types',
      UPDATE: '/membership-types/:id',
      DELETE: '/membership-types/:id',
    },
    DATA_IMPORT: {
      IMPORT_BOOKS: '/data-import/books/excel',
      DOWNLOAD_TEMPLATE: '/data-import/template/books',
      IMPORT_PROGRESS: '/data-import/import-progress',
    },
    DATA_EXPORT: {
      EXPORT_DATA: '/reports/export/:type',
    },
    DASHBOARD: {
      SUMMARY: '/dashboard/summary',
    },
  },
} as const;
