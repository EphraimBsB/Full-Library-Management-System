import axios from 'axios';

export interface ExternalBookData {
  title: string;
  author: string;
  description?: string;
  publisher?: string;
  publicationYear?: number;
  coverImageUrl?: string;
  ddc?: string;
}

export const WorldCatService = {
  fetchBookByISBNFromGoogle: async (isbn: string): Promise<ExternalBookData | null> => {
    try {
      const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
      
      if (response.data.totalItems > 0) {
        const item = response.data.items[0].volumeInfo;
        
        return {
          title: item.title || '',
          author: item.authors ? item.authors.join(', ') : '',
          description: item.description,
          publisher: item.publisher,
          publicationYear: item.publishedDate ? new Date(item.publishedDate).getFullYear() : undefined,
          coverImageUrl: item.imageLinks ? item.imageLinks.thumbnail.replace('http:', 'https:') : undefined,
          // Google Books doesn't always provide DDC, but sometimes it's in the industryIdentifiers
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching book data from Google Books:', error);
      return null;
    }
  }
};
