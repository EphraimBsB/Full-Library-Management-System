export const STORAGE_CONSTANTS = {
  // 50MB max file size for images, 100MB for ebooks
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  
  // Allowed MIME types for uploads
  ALLOWED_MIME_TYPES: [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    
    // Ebooks
    'application/pdf',
    'application/epub+zip',
    'application/x-mobipocket-ebook',
    'application/vnd.amazon.ebook',
    'application/x-fictionbook+xml',
  ],
  
  // MIME types that will be treated as images
  IMAGE_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  STORAGE_PATH: 'storage',
  TEMP_PATH: 'temp',
  CACHE_TTL: 3600, // 1 hour
};
