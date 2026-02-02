import 'package:management_side/src/core/services/cache_service.dart';

/// Utility class for comprehensive System Configuration cache invalidation
class SystemConfigCacheInvalidator {
  static Future<void> invalidateAllSystemConfigCaches({
    String? moduleType,
    int? itemId,
  }) async {
    try {
      final cacheService = CacheService();

      // Invalidate all system configuration caches using the comprehensive method
      await cacheService.invalidateSystemConfigCaches(
        moduleType: moduleType,
        itemId: itemId,
      );

      print('✅ System Configuration cache invalidation completed successfully');
    } catch (e) {
      print('❌ Error invalidating System Configuration caches: $e');
    }
  }

  /// Force refresh all System Configuration data
  static Future<void> forceRefreshSystemConfigData({
    String? moduleType,
    int? itemId,
  }) async {
    await invalidateAllSystemConfigCaches(
      moduleType: moduleType,
      itemId: itemId,
    );

    // Additional cleanup if needed
    final cacheService = CacheService();
    await cacheService.cleanupExpired();

    print('🔄 System Configuration data force refresh completed');
  }

  /// Invalidate caches for specific module operations
  static Future<void> invalidateModuleOperationCaches({
    required String moduleType,
    int? itemId,
  }) async {
    await invalidateAllSystemConfigCaches(
      moduleType: moduleType,
      itemId: itemId,
    );
  }

  /// Invalidate caches for specific item operations
  static Future<void> invalidateItemOperationCaches({
    required String moduleType,
    required int itemId,
  }) async {
    await invalidateAllSystemConfigCaches(
      moduleType: moduleType,
      itemId: itemId,
    );
  }

  // Module-specific convenience methods
  static Future<void> invalidateCategoriesCaches({int? categoryId}) async {
    await invalidateAllSystemConfigCaches(
      moduleType: 'categories',
      itemId: categoryId,
    );
  }

  static Future<void> invalidateSubjectsCaches({int? subjectId}) async {
    await invalidateAllSystemConfigCaches(
      moduleType: 'subjects',
      itemId: subjectId,
    );
  }

  static Future<void> invalidateBookTypesCaches({int? typeId}) async {
    await invalidateAllSystemConfigCaches(
      moduleType: 'types',
      itemId: typeId,
    );
  }

  static Future<void> invalidateSourcesCaches({int? sourceId}) async {
    await invalidateAllSystemConfigCaches(
      moduleType: 'sources',
      itemId: sourceId,
    );
  }

  static Future<void> invalidatePublishersCaches({int? publisherId}) async {
    await invalidateAllSystemConfigCaches(
      moduleType: 'publishers',
      itemId: publisherId,
    );
  }

  static Future<void> invalidateLocationsCaches({int? locationId}) async {
    await invalidateAllSystemConfigCaches(
      moduleType: 'locations',
      itemId: locationId,
    );
  }

  static Future<void> invalidateShelvesCaches({int? shelfId}) async {
    await invalidateAllSystemConfigCaches(
      moduleType: 'shelves',
      itemId: shelfId,
    );
  }

  static Future<void> invalidateDegreesCaches({int? degreeId}) async {
    await invalidateAllSystemConfigCaches(
      moduleType: 'degrees',
      itemId: degreeId,
    );
  }

  static Future<void> invalidateUserRolesCaches({int? roleId}) async {
    await invalidateAllSystemConfigCaches(
      moduleType: 'user_roles',
      itemId: roleId,
    );
  }

  static Future<void> invalidateMembershipTypesCaches({int? membershipTypeId}) async {
    await invalidateAllSystemConfigCaches(
      moduleType: 'membership_types',
      itemId: membershipTypeId,
    );
  }
}
