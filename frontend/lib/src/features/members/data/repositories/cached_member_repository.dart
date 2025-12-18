import 'package:dio/dio.dart';
import 'package:logger/logger.dart';
import 'package:management_side/src/core/services/cache_service.dart';
import 'package:management_side/src/core/data/pagination.dart';
import 'package:management_side/src/features/members/data/api/member_api_service.dart';
import 'package:management_side/src/features/members/domain/models/membership_model.dart';
import 'package:management_side/src/core/network/api_client.dart';

class CachedMemberRepository {
  final MemberApiService _apiService;
  final CacheService _cacheService;
  final Logger _logger = Logger();

  CachedMemberRepository()
    : _apiService = MemberApiService(ApiClient().dio),
      _cacheService = CacheService();

  /// Get memberships with caching
  Future<PaginatedResponse<Membership>> getMemberships({
    int page = 1,
    int limit = 10,
    String? status,
    bool forceRefresh = false,
  }) async {
    final cacheKey = CacheService.membershipsListKey(
      page: page,
      limit: limit,
      status: status,
    );

    try {
      // Try to get from cache first (unless force refresh)
      if (!forceRefresh) {
        final cachedMemberships = await _cacheService
            .get<PaginatedResponse<Membership>>(
              cacheKey,
              fromJson: (json) => PaginatedResponse<Membership>.fromJson(
                json,
                (item) => Membership.fromJson(item as Map<String, dynamic>),
              ),
            );

        if (cachedMemberships != null) {
          _logger.d('Memberships list served from cache: page $page');
          return cachedMemberships;
        }
      }

      // Fetch from API
      final response = await _apiService.getMemberships(
        page: page,
        limit: limit,
        status: status,
      );

      // Cache the response
      await _cacheService.set(
        cacheKey,
        response.toJson((membership) => membership.toJson()),
        duration: Duration(minutes: 15), // Memberships cache for 15 minutes
      );

      _logger.d('Memberships list fetched from API and cached: page $page');
      return response;
    } on DioException catch (e) {
      _logger.e('Error fetching memberships: $e');

      // Try to serve stale cache on network error
      if (!forceRefresh) {
        final staleCache = await _cacheService
            .get<PaginatedResponse<Membership>>(
              cacheKey,
              fromJson: (json) => PaginatedResponse<Membership>.fromJson(
                json,
                (item) => Membership.fromJson(item as Map<String, dynamic>),
              ),
            );

        if (staleCache != null) {
          _logger.w(
            'Serving stale memberships list from cache due to network error',
          );
          return staleCache;
        }
      }

      rethrow;
    } catch (e) {
      _logger.e('Unexpected error fetching memberships: $e');
      rethrow;
    }
  }

  /// Get membership details with caching
  Future<Membership> getMembership(
    String membershipId, {
    bool forceRefresh = false,
  }) async {
    final cacheKey = CacheService.membershipDetailsKey(membershipId);

    try {
      // Try to get from cache first (unless force refresh)
      if (!forceRefresh) {
        final cachedMembership = await _cacheService.get<Membership>(
          cacheKey,
          fromJson: (json) => Membership.fromJson(json),
        );

        if (cachedMembership != null) {
          _logger.d(
            'Membership details served from cache: membershipId $membershipId',
          );
          return cachedMembership;
        }
      }

      // Fetch from API
      final response = await _apiService.getMembership(membershipId);

      // Cache the response
      await _cacheService.set(
        cacheKey,
        response.toJson(),
        duration: Duration(
          minutes: 30,
        ), // Membership details cache for 30 minutes
      );

      _logger.d(
        'Membership details fetched from API and cached: membershipId $membershipId',
      );
      return response;
    } on DioException catch (e) {
      _logger.e('Error fetching membership details: $e');

      // Try to serve stale cache on network error
      if (!forceRefresh) {
        final staleCache = await _cacheService.get<Membership>(
          cacheKey,
          fromJson: (json) => Membership.fromJson(json),
        );

        if (staleCache != null) {
          _logger.w(
            'Serving stale membership details from cache due to network error',
          );
          return staleCache;
        }
      }

      rethrow;
    } catch (e) {
      _logger.e('Unexpected error fetching membership details: $e');
      rethrow;
    }
  }

  /// Get memberships by status with caching
  Future<List<Membership>> getMembershipsByStatus(
    String status, {
    int page = 1,
    int limit = 10,
  }) async {
    final paginatedResponse = await getMemberships(
      page: page,
      limit: limit,
      status: status,
    );
    return paginatedResponse.data;
  }

  /// Get active memberships
  Future<List<Membership>> getActiveMemberships({
    int page = 1,
    int limit = 10,
  }) async {
    return getMembershipsByStatus('active', page: page, limit: limit);
  }

  /// Get expired memberships
  Future<List<Membership>> getExpiredMemberships({
    int page = 1,
    int limit = 10,
  }) async {
    return getMembershipsByStatus('expired', page: page, limit: limit);
  }

  /// Invalidate memberships cache
  Future<void> invalidateMembershipsCache() async {
    await _cacheService.clear(prefix: 'memberships_list');
    _logger.d('Memberships list cache invalidated');
  }

  /// Invalidate specific membership details cache
  Future<void> invalidateMembershipDetailsCache(String membershipId) async {
    await _cacheService.remove(CacheService.membershipDetailsKey(membershipId));
    _logger.d(
      'Membership details cache invalidated: membershipId $membershipId',
    );
  }

  /// Invalidate all memberships-related cache
  Future<void> invalidateAllMembershipsCache() async {
    await _cacheService.clear(prefix: 'memberships_');
    _logger.d('All memberships cache invalidated');
  }

  /// Preload membership data
  Future<void> preloadMembershipData() async {
    try {
      // Preload first page of memberships
      await getMemberships(page: 1, limit: 20);

      // Preload active and expired memberships
      await getActiveMemberships(page: 1, limit: 10);
      await getExpiredMemberships(page: 1, limit: 10);

      _logger.d('Membership data preloaded into cache');
    } catch (e) {
      _logger.e('Error preloading membership data: $e');
    }
  }

  /// Get cache statistics
  Map<String, dynamic> getCacheStats() {
    return _cacheService.getStats();
  }

  /// Clear expired cache entries
  Future<void> cleanupExpiredCache() async {
    await _cacheService.cleanupExpired();
    _logger.d('Expired memberships cache cleaned up');
  }
}
