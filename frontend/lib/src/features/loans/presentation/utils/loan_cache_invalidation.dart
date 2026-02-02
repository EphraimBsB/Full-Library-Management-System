import 'package:management_side/src/core/services/cache_service.dart';

/// Utility class for comprehensive loan cache invalidation
class LoanCacheInvalidator {
  static Future<void> invalidateAllLoanCaches({
    String? loanId,
    String? userId,
  }) async {
    try {
      final cacheService = CacheService();

      // Invalidate all loan-related caches using the comprehensive method
      await cacheService.invalidateLoanCaches(
        loanId: loanId,
        userId: userId,
      );

      print('✅ Loan cache invalidation completed successfully');
    } catch (e) {
      print('❌ Error invalidating loan caches: $e');
    }
  }

  /// Force refresh all loan data
  static Future<void> forceRefreshLoanData({
    String? loanId,
    String? userId,
  }) async {
    await invalidateAllLoanCaches(
      loanId: loanId,
      userId: userId,
    );

    // Additional cleanup if needed
    final cacheService = CacheService();
    await cacheService.cleanupExpired();

    print('🔄 Loan data force refresh completed');
  }

  /// Invalidate caches for specific loan operations
  static Future<void> invalidateLoanOperationCaches({
    required String loanId,
    String? userId,
  }) async {
    await invalidateAllLoanCaches(
      loanId: loanId,
      userId: userId,
    );
  }

  /// Invalidate caches for user-specific loan operations
  static Future<void> invalidateUserLoanCaches(String userId) async {
    await invalidateAllLoanCaches(userId: userId);
  }
}
