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

  // Cache duration constants
  static const Duration shortCache = Duration(minutes: 5);
  static const Duration mediumCache = Duration(hours: 1);
  static const Duration longCache = Duration(hours: 24);
  static const Duration veryLongCache = Duration(days: 7);

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
        final keys = _prefs.getKeys().where((key) => key.startsWith(prefix));
        for (final key in keys) {
          await remove(key);
        }
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

  static String categoriesKey() => 'categories_list';
  static String subjectsKey() => 'subjects_list';
  static String typesKey() => 'types_list';
  static String sourcesKey() => 'sources_list';

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
