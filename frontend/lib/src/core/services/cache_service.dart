import 'dart:convert';
import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:logger/logger.dart';

class CacheService {
  static final CacheService _instance = CacheService._internal();
  final Logger _logger = Logger();
  late final SharedPreferences _prefs;
  late final BaseCacheManager _fileCacheManager;

  // Cache duration constants - REDUCED for better responsiveness
  static const Duration shortCache = Duration(minutes: 1); // Reduced from 2 min
  static const Duration mediumCache = Duration(
    minutes: 3,
  ); // Reduced from 5 min
  static const Duration longCache = Duration(
    minutes: 10,
  ); // Reduced from 30 min
  static const Duration veryLongCache = Duration(
    hours: 1,
  ); // Reduced from 2 hours

  factory CacheService() {
    return _instance;
  }

  CacheService._internal();

  Future<void> initialize() async {
    try {
      _prefs = await SharedPreferences.getInstance();
      _fileCacheManager = DefaultCacheManager();
      _logger.i('Cache service initialized successfully');
    } catch (e) {
      _logger.e('Failed to initialize cache service: $e');
    }
  }

  // Memory cache for frequently accessed data
  final Map<String, CacheEntry> _memoryCache = {};

  // Generic cache methods
  Future<T?> get<T>(
    String key, {
    T? Function(Map<String, dynamic>)? fromJson,
  }) async {
    try {
      // Check memory cache first
      final memoryEntry = _memoryCache[key];
      if (memoryEntry != null && !memoryEntry.isExpired) {
        _logger.d('Cache hit (memory): $key');
        return memoryEntry.data as T?;
      }

      // Check persistent cache
      final cachedData = _prefs.getString(key);
      if (cachedData != null) {
        final cacheMap = jsonDecode(cachedData) as Map<String, dynamic>;
        final entry = CacheEntry.fromMap(cacheMap);

        if (!entry.isExpired) {
          // Store in memory cache for faster access
          _memoryCache[key] = entry;
          _logger.d('Cache hit (persistent): $key');
          return entry.data as T?;
        } else {
          // Remove expired entry
          await remove(key);
        }
      }

      _logger.d('Cache miss: $key');
      return null;
    } catch (e) {
      _logger.e('Error getting cache for key $key: $e');
      return null;
    }
  }

  Future<void> set<T>(
    String key,
    T data, {
    Duration duration = mediumCache,
    bool useMemoryCache = true,
  }) async {
    try {
      final entry = CacheEntry(
        data: data,
        timestamp: DateTime.now(),
        duration: duration,
      );

      // Store in memory cache
      if (useMemoryCache) {
        _memoryCache[key] = entry;
      }

      // Store in persistent cache
      final cacheMap = entry.toMap();
      await _prefs.setString(key, jsonEncode(cacheMap));

      _logger.d('Cache set: $key (duration: ${duration.inMinutes}min)');
    } catch (e) {
      _logger.e('Error setting cache for key $key: $e');
    }
  }

  Future<void> remove(String key) async {
    try {
      _memoryCache.remove(key);
      await _prefs.remove(key);
      _logger.d('Cache removed: $key');
    } catch (e) {
      _logger.e('Error removing cache for key $key: $e');
    }
  }

  Future<void> clear({String? prefix}) async {
    try {
      if (prefix != null) {
        // Clear cache entries with specific prefix
        final keys = _prefs
            .getKeys()
            .where((key) => key.startsWith(prefix))
            .toList();

        // Parallelize removals
        await Future.wait(keys.map((key) => remove(key)));

        _logger.d('Cleared ${keys.length} entries with prefix: $prefix');
      } else {
        // Clear all cache
        _memoryCache.clear();
        await _prefs.clear();
        await _fileCacheManager.emptyCache();
        _logger.d('All cache cleared');
      }
    } catch (e) {
      _logger.e('Error clearing cache: $e');
    }
  }

  // File caching for images and documents
  Future<File?> getFile(String url, {Duration? customDuration}) async {
    try {
      final fileInfo = await _fileCacheManager.getFileFromCache(url);
      if (fileInfo != null && !fileInfo.validTill.isBefore(DateTime.now())) {
        _logger.d('File cache hit: $url');
        return fileInfo.file;
      }

      final file = await _fileCacheManager.downloadFile(url);
      _logger.d('File cached: $url');
      return file.file;
    } catch (e) {
      _logger.e('Error caching file $url: $e');
      return null;
    }
  }

  // Cache key generators
  static String booksListKey({
    int page = 1,
    int limit = 10,
    String? search,
    String? category,
    String? type,
    int? minAvailable,
    String? sortBy,
    String? sortOrder,
  }) {
    return 'books_list_${page}_${limit}_${search ?? 'null'}_${category ?? 'null'}_${type ?? 'null'}_${minAvailable ?? 'null'}_${sortBy ?? 'null'}_${sortOrder ?? 'null'}';
  }

  static String bookDetailsKey(int bookId) {
    return 'book_details_$bookId';
  }

  // Predefined prefixes for invalidation
  static const String booksListPrefix = 'books_list';
  static const String booksSearchPrefix = 'books_search';
  static const String bookDetailsPrefix = 'book_details_';

  // NEW: Comprehensive book cache invalidation
  static List<String> getBookRelatedCacheKeys(int? bookId) {
    final keys = <String>[];

    // Add all possible book list cache keys (common combinations)
    final commonPages = [1, 2, 3, 4, 5];
    final commonLimits = [10, 20, 50];
    final commonSorts = ['title', 'author', 'createdAt', 'publicationYear'];
    final commonOrders = ['asc', 'desc'];

    for (final page in commonPages) {
      for (final limit in commonLimits) {
        for (final sort in commonSorts) {
          for (final order in commonOrders) {
            keys.add(
              booksListKey(
                page: page,
                limit: limit,
                search: null,
                category: null,
                type: null,
                sortBy: sort,
                sortOrder: order,
              ),
            );
          }
        }
      }
    }

    // Add book details key if bookId is provided
    if (bookId != null) {
      keys.add(bookDetailsKey(bookId));
    }

    // Add other book-related cache keys
    keys.addAll([
      'categories_list',
      'subjects_list',
      'types_list',
      'sources_list',
      'popular_books',
      'search_suggestions',
    ]);

    return keys;
  }

  // NEW: Force refresh book caches
  Future<void> invalidateBookCaches({
    int? bookId,
    bool forceRefresh = true,
  }) async {
    try {
      _logger.i('Invalidating book-related caches...');

      // Use efficient prefix-based clearing instead of iterating 120+ keys
      final prefixes = [
        'books_',
        'book_',
        'popular_',
        'search_',
        'api_cache_books_',
      ];

      // Add specific book details key if needed
      if (bookId != null) {
        await remove(bookDetailsKey(bookId));
      }

      // Parallelize all prefix-based clearing
      await Future.wait(prefixes.map((p) => clear(prefix: p)));

      // Extra safety for memory cache (synchronous)
      _memoryCache.removeWhere(
        (key, value) => prefixes.any((p) => key.startsWith(p)),
      );

      _logger.i('Book cache invalidation completed efficiently');
    } catch (e) {
      _logger.e('Error invalidating book caches: $e');
    }
  }

  // NEW: Comprehensive loan cache invalidation
  Future<void> invalidateLoanCaches({
    String? loanId,
    String? userId,
    bool forceRefresh = true,
  }) async {
    try {
      _logger.i('Invalidating loan-related caches...');

      // Use efficient prefix-based clearing
      final prefixes = [
        'loans_',
        'loan_',
        'user_loans_',
        'overdue_loans_',
        'api_cache_loans_',
      ];

      // Add specific loan details key if needed
      if (loanId != null) {
        await remove(loanDetailsKey(loanId));
      }

      // Add specific user loans keys if needed
      if (userId != null) {
        await remove(userLoansKey(userId));
        await remove(userLoansKey(userId, status: 'active'));
        await remove(userLoansKey(userId, status: 'overdue'));
        await remove(userLoansKey(userId, status: 'returned'));
        await remove(overdueLoansKey(userId: userId));
      }

      // Clear loan statistics
      await remove(loanStatsKey());

      // Parallelize all prefix-based clearing
      await Future.wait(prefixes.map((p) => clear(prefix: p)));

      // Extra safety for memory cache (synchronous)
      _memoryCache.removeWhere(
        (key, value) => prefixes.any((p) => key.startsWith(p)),
      );

      _logger.i('Loan cache invalidation completed efficiently');
    } catch (e) {
      _logger.e('Error invalidating loan caches: $e');
    }
  }

  static String membershipsListKey({
    int page = 1,
    int limit = 10,
    String? status,
  }) {
    return 'memberships_list_${page}_${limit}_${status ?? 'null'}';
  }

  static String membershipDetailsKey(String membershipId) {
    return 'membership_details_$membershipId';
  }

  static String loansListKey({int page = 1, int limit = 10, String? status}) {
    return 'loans_list_${page}_${limit}_${status ?? 'null'}';
  }

  static String loanDetailsKey(String loanId) {
    return 'loan_details_$loanId';
  }

  static String userLoansKey(String userId, {String? status}) {
    return 'user_loans_${userId}_${status ?? 'null'}';
  }

  static String overdueLoansKey({String? userId}) {
    return 'overdue_loans_${userId ?? 'all'}';
  }

  static String loanStatsKey() => 'loan_stats';

  // System Configuration Cache Keys
  static String categoriesKey() => 'categories_list';
  static String subjectsKey() => 'subjects_list';
  static String typesKey() => 'types_list';
  static String sourcesKey() => 'sources_list';
  static String publishersKey() => 'publishers_list';
  static String locationsKey() => 'locations_list';
  static String shelvesKey() => 'shelves_list';
  static String degreesKey() => 'degrees_list';
  static String userRolesKey() => 'user_roles_list';
  static String membershipTypesKey() => 'membership_types_list';

  // Detailed cache keys for individual items
  static String categoryDetailsKey(int id) => 'category_details_$id';
  static String subjectDetailsKey(int id) => 'subject_details_$id';
  static String typeDetailsKey(int id) => 'type_details_$id';
  static String sourceDetailsKey(int id) => 'source_details_$id';
  static String publisherDetailsKey(int id) => 'publisher_details_$id';
  static String locationDetailsKey(int id) => 'location_details_$id';
  static String shelfDetailsKey(int id) => 'shelf_details_$id';
  static String degreeDetailsKey(int id) => 'degree_details_$id';
  static String userRoleDetailsKey(int id) => 'user_role_details_$id';
  static String membershipTypeDetailsKey(int id) =>
      'membership_type_details_$id';

  // NEW: Comprehensive System Configuration cache invalidation
  Future<void> invalidateSystemConfigCaches({
    String? moduleType, // 'categories', 'subjects', 'types', etc.
    int? itemId,
    bool forceRefresh = true,
  }) async {
    try {
      _logger.i('Invalidating System Configuration caches...');

      // Use efficient prefix-based clearing for all system configs
      final prefixes = [
        // Application-level cache prefixes
        'categories_',
        'subjects_',
        'types_',
        'sources_',
        'publishers_',
        'locations_',
        'shelves_',
        'degrees_',
        'user_roles_',
        'membership_types_',
        // API cache interceptor prefixes
        'api_cache_categories_',
        'api_cache_subjects_',
        'api_cache_types_',
        'api_cache_sources_',
        'api_cache_publishers_',
        'api_cache_locations_',
        'api_cache_shelves_',
        'api_cache_degrees_',
        'api_cache_user_roles_',
        'api_cache_membership_types_',
      ];

      // Clear specific module caches if moduleType is specified
      if (moduleType != null) {
        await _invalidateSpecificModule(moduleType, itemId);
      }

      // Clear all list caches
      await remove(categoriesKey());
      await remove(subjectsKey());
      await remove(typesKey());
      await remove(sourcesKey());
      await remove(publishersKey());
      await remove(locationsKey());
      await remove(shelvesKey());
      await remove(degreesKey());
      await remove(userRolesKey());
      await remove(membershipTypesKey());

      // Clear specific item details if itemId is provided
      if (itemId != null && moduleType != null) {
        await _invalidateItemDetails(moduleType, itemId);
      }

      // Parallelize all prefix-based clearing
      await Future.wait(prefixes.map((p) => clear(prefix: p)));

      // Extra safety for memory cache (synchronous)
      _memoryCache.removeWhere(
        (key, value) => prefixes.any((p) => key.startsWith(p)),
      );

      _logger.i(
        'System Configuration cache invalidation completed efficiently',
      );
    } catch (e) {
      _logger.e('Error invalidating System Configuration caches: $e');
    }
  }

  // Helper method to invalidate specific module caches
  Future<void> _invalidateSpecificModule(String moduleType, int? itemId) async {
    switch (moduleType.toLowerCase()) {
      case 'categories':
        await remove(categoriesKey());
        if (itemId != null) await remove(categoryDetailsKey(itemId));
        break;
      case 'subjects':
        await remove(subjectsKey());
        if (itemId != null) await remove(subjectDetailsKey(itemId));
        break;
      case 'types':
      case 'book_types':
        await remove(typesKey());
        if (itemId != null) await remove(typeDetailsKey(itemId));
        break;
      case 'sources':
      case 'book_sources':
        await remove(sourcesKey());
        if (itemId != null) await remove(sourceDetailsKey(itemId));
        break;
      case 'publishers':
        await remove(publishersKey());
        if (itemId != null) await remove(publisherDetailsKey(itemId));
        break;
      case 'locations':
        await remove(locationsKey());
        if (itemId != null) await remove(locationDetailsKey(itemId));
        break;
      case 'shelves':
        await remove(shelvesKey());
        if (itemId != null) await remove(shelfDetailsKey(itemId));
        break;
      case 'degrees':
        await remove(degreesKey());
        if (itemId != null) await remove(degreeDetailsKey(itemId));
        break;
      case 'user_roles':
        await remove(userRolesKey());
        if (itemId != null) await remove(userRoleDetailsKey(itemId));
        break;
      case 'membership_types':
        await remove(membershipTypesKey());
        if (itemId != null) await remove(membershipTypeDetailsKey(itemId));
        break;
    }
  }

  // Helper method to invalidate specific item details
  Future<void> _invalidateItemDetails(String moduleType, int itemId) async {
    switch (moduleType.toLowerCase()) {
      case 'categories':
        await remove(categoryDetailsKey(itemId));
        break;
      case 'subjects':
        await remove(subjectDetailsKey(itemId));
        break;
      case 'types':
      case 'book_types':
        await remove(typeDetailsKey(itemId));
        break;
      case 'sources':
      case 'book_sources':
        await remove(sourceDetailsKey(itemId));
        break;
      case 'publishers':
        await remove(publisherDetailsKey(itemId));
        break;
      case 'locations':
        await remove(locationDetailsKey(itemId));
        break;
      case 'shelves':
        await remove(shelfDetailsKey(itemId));
        break;
      case 'degrees':
        await remove(degreeDetailsKey(itemId));
        break;
      case 'user_roles':
        await remove(userRoleDetailsKey(itemId));
        break;
      case 'membership_types':
        await remove(membershipTypeDetailsKey(itemId));
        break;
    }
  }

  // Cache statistics
  Map<String, dynamic> getStats() {
    return {
      'memoryCacheSize': _memoryCache.length,
      'persistentCacheSize': _prefs.getKeys().length,
      'memoryCacheKeys': _memoryCache.keys.toList(),
      'persistentCacheKeys': _prefs.getKeys().toList(),
    };
  }

  // Cleanup expired entries
  Future<void> cleanupExpired() async {
    try {
      final keys = _prefs.getKeys();
      int removedCount = 0;

      for (final key in keys) {
        final cachedData = _prefs.getString(key);
        if (cachedData != null) {
          try {
            final cacheMap = jsonDecode(cachedData) as Map<String, dynamic>;
            final entry = CacheEntry.fromMap(cacheMap);

            if (entry.isExpired) {
              await remove(key);
              removedCount++;
            }
          } catch (e) {
            // Remove corrupted entries
            await remove(key);
            removedCount++;
          }
        }
      }

      // Clean memory cache
      _memoryCache.removeWhere((key, entry) => entry.isExpired);

      _logger.i(
        'Cache cleanup completed. Removed $removedCount expired entries.',
      );
    } catch (e) {
      _logger.e('Error during cache cleanup: $e');
    }
  }
}

class CacheEntry {
  final dynamic data;
  final DateTime timestamp;
  final Duration duration;

  CacheEntry({
    required this.data,
    required this.timestamp,
    required this.duration,
  });

  bool get isExpired => DateTime.now().isAfter(timestamp.add(duration));

  Map<String, dynamic> toMap() {
    return {
      'data': data,
      'timestamp': timestamp.toIso8601String(),
      'duration': duration.inMilliseconds,
    };
  }

  factory CacheEntry.fromMap(Map<String, dynamic> map) {
    return CacheEntry(
      data: map['data'],
      timestamp: DateTime.parse(map['timestamp']),
      duration: Duration(milliseconds: map['duration']),
    );
  }
}
