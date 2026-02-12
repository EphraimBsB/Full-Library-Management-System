import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import '../services/cache_service.dart';

class CacheInterceptor extends Interceptor {
  final CacheService _cacheService = CacheService();
  final Logger _logger = Logger();

  // Cacheable HTTP methods and their default durations
  static const Map<String, Duration> _defaultCacheDurations = {
    'GET': Duration(minutes: 5),
  };

  // Endpoints that should be cached with custom durations
  static const Map<String, Duration> _endpointCacheDurations = {
    // Books
    '/books': Duration(minutes: 10),
    '/books/': Duration(minutes: 30), // Book details
    // Memberships
    '/memberships': Duration(minutes: 15),
    '/memberships/': Duration(minutes: 30), // Membership details
    // Categories/Subjects/Types/Sources (change rarely)
    '/categories': Duration(hours: 24),
    '/subjects': Duration(hours: 24),
    '/types': Duration(hours: 24),
    '/sources': Duration(hours: 24),
    // Loans (change frequently)
    '/loans': Duration(minutes: 2),
    '/loans/': Duration(minutes: 5), // Loan details
  };

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // Check if this request should be served from cache
    if (_shouldCacheRequest(options)) {
      _serveFromCache(options, handler);
    } else {
      handler.next(options);
    }
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    // 1. Detect mutations and invalidate cache
    final method = response.requestOptions.method;
    if (['POST', 'PUT', 'PATCH', 'DELETE'].contains(method)) {
      _invalidateRelevantCache(response.requestOptions.path);
    }

    // 2. Cache the response if applicable
    if (_shouldCacheResponse(response.requestOptions)) {
      _cacheResponse(response);
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    // Try to serve from cache on network error
    if (err.type == DioExceptionType.connectionError ||
        err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout) {
      if (_shouldCacheRequest(err.requestOptions)) {
        _serveFromCacheOnError(err.requestOptions, handler);
        return;
      }
    }
    handler.next(err);
  }

  void _serveFromCache(
    RequestOptions options,
    RequestInterceptorHandler handler, {
    bool isOffline = false,
  }) {
    final cacheKey = _generateCacheKey(options);

    _cacheService
        .get<String>(cacheKey)
        .then((cachedResponse) {
          if (cachedResponse != null) {
            try {
              final responseData = jsonDecode(cachedResponse);
              final cachedResponseData = Response(
                data: responseData['data'],
                statusCode: responseData['statusCode'],
                requestOptions: options,
              );

              _logger.d(
                'Serving from cache: ${options.path} ${isOffline ? '(offline)' : ''}',
              );
              handler.resolve(cachedResponseData);
            } catch (e) {
              _logger.e('Error parsing cached response: $e');
              handler.next(options);
            }
          } else {
            handler.next(options);
          }
        })
        .catchError((error) {
          _logger.e('Error accessing cache: $error');
          handler.next(options);
        });
  }

  void _serveFromCacheOnError(
    RequestOptions options,
    ErrorInterceptorHandler handler,
  ) {
    final cacheKey = _generateCacheKey(options);

    _cacheService
        .get<String>(cacheKey)
        .then((cachedResponse) {
          if (cachedResponse != null) {
            try {
              final responseData = jsonDecode(cachedResponse);
              final cachedResponseData = Response(
                data: responseData['data'],
                statusCode: responseData['statusCode'],
                requestOptions: options,
              );

              _logger.d('Serving from cache (offline): ${options.path}');
              handler.resolve(cachedResponseData);
            } catch (e) {
              _logger.e('Error parsing cached response: $e');
              handler.next(
                DioException(
                  requestOptions: options,
                  type: DioExceptionType.unknown,
                  error: 'Failed to parse cached response',
                ),
              );
            }
          } else {
            handler.next(
              DioException(
                requestOptions: options,
                type: DioExceptionType.unknown,
                error: 'No cached data available',
              ),
            );
          }
        })
        .catchError((error) {
          _logger.e('Error accessing cache: $error');
          handler.next(
            DioException(
              requestOptions: options,
              type: DioExceptionType.unknown,
              error: 'Cache access failed',
            ),
          );
        });
  }

  void _cacheResponse(Response response) {
    final cacheKey = _generateCacheKey(response.requestOptions);
    final duration = _getCacheDuration(response.requestOptions);

    try {
      final responseData = {
        'data': response.data,
        'statusCode': response.statusCode,
        'timestamp': DateTime.now().toIso8601String(),
      };

      _cacheService.set(
        cacheKey,
        jsonEncode(responseData),
        duration: duration,
        useMemoryCache: true,
      );

      _logger.d(
        'Cached response: ${response.requestOptions.path} (${duration.inMinutes}min)',
      );
    } catch (e) {
      _logger.e('Error caching response: $e');
    }
  }

  bool _shouldCacheRequest(RequestOptions options) {
    // Only cache GET requests by default
    if (options.method != 'GET') return false;

    // Don't cache if explicitly disabled
    if (options.extra['cache'] == false) return false;

    // Check if endpoint is in our cacheable list
    final path = options.path;
    return _endpointCacheDurations.keys.any(
      (endpoint) => path.startsWith(endpoint) || path.contains(endpoint),
    );
  }

  bool _shouldCacheResponse(RequestOptions options) {
    return _shouldCacheRequest(options);
  }

  String _generateCacheKey(RequestOptions options) {
    final path = options.path;
    final query = options.queryParameters;
    final headers = options.headers;

    // Determine prefix based on path
    String prefix = 'api_cache_';
    if (path.contains('/books'))
      prefix += 'books_';
    else if (path.contains('/loans'))
      prefix += 'loans_';
    else if (path.contains('/memberships'))
      prefix += 'memberships_';
    // System Configuration modules
    else if (path.contains('/categories'))
      prefix += 'categories_';
    else if (path.contains('/subjects'))
      prefix += 'subjects_';
    else if (path.contains('/types'))
      prefix += 'types_';
    else if (path.contains('/sources'))
      prefix += 'sources_';
    else if (path.contains('/publishers'))
      prefix += 'publishers_';
    else if (path.contains('/locations'))
      prefix += 'locations_';
    else if (path.contains('/shelves'))
      prefix += 'shelves_';
    else if (path.contains('/degrees'))
      prefix += 'degrees_';
    else if (path.contains('/user_roles'))
      prefix += 'user_roles_';
    else if (path.contains('/membership_types'))
      prefix += 'membership_types_';

    // Create a unique cache key based on URL, query params, and relevant headers
    final keyParts = [path, query.toString(), headers['authorization'] ?? ''];

    return '${prefix}${keyParts.join('_').hashCode}';
  }

  void _invalidateRelevantCache(String path) {
    String? prefix;
    if (path.contains('/books'))
      prefix = 'api_cache_books_';
    else if (path.contains('/loans'))
      prefix = 'api_cache_loans_';
    else if (path.contains('/memberships'))
      prefix = 'api_cache_memberships_';
    else if (path.contains('/users/member'))
      prefix =
          'api_cache_users_'; // Add user member creation cache invalidation
    // System Configuration modules
    else if (path.contains('/categories'))
      prefix = 'api_cache_categories_';
    else if (path.contains('/subjects'))
      prefix = 'api_cache_subjects_';
    else if (path.contains('/types'))
      prefix = 'api_cache_types_';
    else if (path.contains('/sources'))
      prefix = 'api_cache_sources_';
    else if (path.contains('/publishers'))
      prefix = 'api_cache_publishers_';
    else if (path.contains('/locations'))
      prefix = 'api_cache_locations_';
    else if (path.contains('/shelves'))
      prefix = 'api_cache_shelves_';
    else if (path.contains('/degrees'))
      prefix = 'api_cache_degrees_';
    else if (path.contains('/user_roles'))
      prefix = 'api_cache_user_roles_';
    else if (path.contains('/membership_types'))
      prefix = 'api_cache_membership_types_';

    if (prefix != null) {
      _cacheService.clear(prefix: prefix);
      _logger.d('Invalidated cache with prefix: $prefix');
    }
  }

  Duration _getCacheDuration(RequestOptions options) {
    final path = options.path;

    // Check for custom endpoint duration
    for (final endpoint in _endpointCacheDurations.keys) {
      if (path.startsWith(endpoint) || path.contains(endpoint)) {
        return _endpointCacheDurations[endpoint]!;
      }
    }

    // Use default duration for HTTP method
    return _defaultCacheDurations[options.method] ?? Duration(minutes: 5);
  }

  // Method to invalidate cache for specific endpoints
  Future<void> invalidateCache(String pattern) async {
    await _cacheService.clear(prefix: 'api_cache_${pattern.hashCode}');
    _logger.d('Invalidated cache for pattern: $pattern');
  }

  // Method to invalidate all API cache
  Future<void> clearAllApiCache() async {
    await _cacheService.clear(prefix: 'api_cache_');
    _logger.d('Cleared all API cache');
  }
}
