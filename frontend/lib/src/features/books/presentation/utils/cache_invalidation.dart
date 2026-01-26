import 'package:management_side/src/core/services/cache_service.dart';

/// Utility class for comprehensive book cache invalidation
class BookCacheInvalidator {
  static Future<void> invalidateAllBookCaches({int? bookId}) async {
    try {
      final cacheService = CacheService();

      // Invalidate all book-related caches using the comprehensive method
      await cacheService.invalidateBookCaches(bookId: bookId);

      print('✅ Book cache invalidation completed successfully');
    } catch (e) {
      print('❌ Error invalidating book caches: $e');
    }
  }

  /// Force refresh all book data
  static Future<void> forceRefreshBookData({int? bookId}) async {
    await invalidateAllBookCaches(bookId: bookId);

    // Additional cleanup if needed
    final cacheService = CacheService();
    await cacheService.cleanupExpired();

    print('🔄 Book data force refresh completed');
  }
}
