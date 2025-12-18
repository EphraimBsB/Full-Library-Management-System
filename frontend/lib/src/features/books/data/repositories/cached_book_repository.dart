import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import 'package:management_side/src/core/services/cache_service.dart';
import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/features/books/data/api/book_api_service.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/models/book_details.dart';
import 'package:management_side/src/core/network/api_client.dart';

class CachedBookRepository {
  final BookApiService _apiService;
  final CacheService _cacheService;
  final Logger _logger = Logger();

  CachedBookRepository()
    : _apiService = BookApiService(ApiClient().dio),
      _cacheService = CacheService();

  /// Get books with caching
  Future<PaginatedResponse<BookModel>> getBooks({
    int page = 1,
    int limit = 10,
    String? search,
    String? category,
    String? type,
    int? minAvailable,
    String? sortBy,
    String? sortOrder,
    bool forceRefresh = false,
  }) async {
    final cacheKey = CacheService.booksListKey(
      page: page,
      limit: limit,
      search: search,
      category: category,
      type: type,
      minAvailable: minAvailable,
      sortBy: sortBy,
      sortOrder: sortOrder,
    );

    try {
      // Try to get from cache first (unless force refresh)
      if (!forceRefresh) {
        final cachedData = await _cacheService.get<String>(cacheKey);
        if (cachedData != null) {
          try {
            final jsonData = jsonDecode(cachedData) as Map<String, dynamic>;
            final cachedBooks = PaginatedResponse<BookModel>.fromJson(
              jsonData,
              (json) => BookModel.fromJson(json as Map<String, dynamic>),
            );
            _logger.d('Books list served from cache: page $page');
            return cachedBooks;
          } catch (e) {
            _logger.w('Failed to parse cached books data: $e');
          }
        }
      }

      // Fetch from API
      final response = await _apiService.getBooks(
        page: page,
        limit: limit,
        search: search,
        category: category,
        type: type,
        minAvailable: minAvailable,
        sortBy: sortBy,
        sortOrder: sortOrder,
      );

      // Cache the response as JSON string
      final responseData = {
        'data': response.items.map((book) => book.toJson()).toList(),
        'total': response.totalItems,
        'page': response.currentPage,
        'limit': response.itemsPerPage,
        'totalPages': response.totalPages,
      };
      await _cacheService.set(
        cacheKey,
        jsonEncode(responseData),
        duration: Duration(minutes: 10), // Books list cache for 10 minutes
      );

      _logger.d('Books list fetched from API and cached: page $page');
      return response;
    } on DioException catch (e) {
      _logger.e('Error fetching books: $e');

      // Try to serve stale cache on network error
      if (!forceRefresh) {
        final cachedData = await _cacheService.get<String>(cacheKey);
        if (cachedData != null) {
          try {
            final jsonData = jsonDecode(cachedData) as Map<String, dynamic>;
            final staleCache = PaginatedResponse<BookModel>.fromJson(
              jsonData,
              (json) => BookModel.fromJson(json as Map<String, dynamic>),
            );
            _logger.w(
              'Serving stale books list from cache due to network error',
            );
            return staleCache;
          } catch (e) {
            _logger.w('Failed to parse stale cached data: $e');
          }
        }
      }

      rethrow;
    } catch (e) {
      _logger.e('Unexpected error fetching books: $e');
      rethrow;
    }
  }

  /// Get book details with caching
  Future<BookDetails> getBookDetails(
    int bookId, {
    bool forceRefresh = false,
  }) async {
    final cacheKey = CacheService.bookDetailsKey(bookId);

    try {
      // Try to get from cache first (unless force refresh)
      if (!forceRefresh) {
        final cachedData = await _cacheService.get<String>(cacheKey);
        if (cachedData != null) {
          try {
            final jsonData = jsonDecode(cachedData) as Map<String, dynamic>;
            final cachedBook = BookDetails.fromJson(jsonData);
            _logger.d('Book details served from cache: bookId $bookId');
            return cachedBook;
          } catch (e) {
            _logger.w('Failed to parse cached book details: $e');
          }
        }
      }

      // Fetch from API
      final response = await _apiService.getBookDetails(bookId);

      // Cache the response as JSON string
      await _cacheService.set(
        cacheKey,
        jsonEncode(response.toJson()),
        duration: Duration(minutes: 30), // Book details cache for 30 minutes
      );

      _logger.d('Book details fetched from API and cached: bookId $bookId');
      return response;
    } on DioException catch (e) {
      _logger.e('Error fetching book details: $e');

      // Try to serve stale cache on network error
      if (!forceRefresh) {
        final cachedData = await _cacheService.get<String>(cacheKey);
        if (cachedData != null) {
          try {
            final jsonData = jsonDecode(cachedData) as Map<String, dynamic>;
            final staleCache = BookDetails.fromJson(jsonData);
            _logger.w(
              'Serving stale book details from cache due to network error',
            );
            return staleCache;
          } catch (e) {
            _logger.w('Failed to parse stale cached book details: $e');
          }
        }
      }

      rethrow;
    } catch (e) {
      _logger.e('Unexpected error fetching book details: $e');
      rethrow;
    }
  }

  /// Search books with caching
  Future<PaginatedResponse<BookModel>> searchBooks({
    required String query,
    int page = 1,
    int limit = 10,
    String? category,
    String? type,
  }) async {
    return getBooks(
      page: page,
      limit: limit,
      search: query,
      category: category,
      type: type,
    );
  }

  /// Get books by category with caching
  Future<PaginatedResponse<BookModel>> getBooksByCategory(
    String category, {
    int page = 1,
    int limit = 10,
  }) async {
    return getBooks(page: page, limit: limit, category: category);
  }

  /// Invalidate books cache
  Future<void> invalidateBooksCache() async {
    await _cacheService.clear(prefix: 'books_list');
    _logger.d('Books list cache invalidated');
  }

  /// Invalidate specific book details cache
  Future<void> invalidateBookDetailsCache(int bookId) async {
    await _cacheService.remove(CacheService.bookDetailsKey(bookId));
    _logger.d('Book details cache invalidated: bookId $bookId');
  }

  /// Invalidate all books-related cache
  Future<void> invalidateAllBooksCache() async {
    await _cacheService.clear(prefix: 'books_');
    _logger.d('All books cache invalidated');
  }

  /// Preload popular books
  Future<void> preloadPopularBooks() async {
    try {
      // Preload first page of books
      await getBooks(page: 1, limit: 20);

      // You could also preload books from popular categories
      await getBooks(page: 1, limit: 10, category: 'fiction');
      await getBooks(page: 1, limit: 10, category: 'non-fiction');

      _logger.d('Popular books preloaded into cache');
    } catch (e) {
      _logger.e('Error preloading popular books: $e');
    }
  }

  /// Get cache statistics
  Map<String, dynamic> getCacheStats() {
    return _cacheService.getStats();
  }

  /// Clear expired cache entries
  Future<void> cleanupExpiredCache() async {
    await _cacheService.cleanupExpired();
    _logger.d('Expired books cache cleaned up');
  }
}
