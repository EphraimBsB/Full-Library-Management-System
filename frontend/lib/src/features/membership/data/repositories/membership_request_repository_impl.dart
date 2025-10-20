import 'dart:developer' show log;
import 'package:flutter/foundation.dart' show kDebugMode;

import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/membership/data/api/membership_api_service.dart';
import 'package:management_side/src/features/membership/domain/models/membership_request_model.dart';
import 'package:management_side/src/features/membership/domain/repositories/membership_request_repository.dart';

class MembershipRequestRepositoryImpl implements MembershipRequestRepository {
  final MembershipApiService _apiService;

  const MembershipRequestRepositoryImpl(this._apiService);

  Future<Either<Failure, T>> _handleApiCall<T>(
    Future<ApiResponse<dynamic>> Function() apiCall, {
    String operation = 'operation',
    T Function(dynamic data)? transform,
  }) async {
    try {
      final response = await apiCall();

      if (response.success == true || response.data != null) {
        final data = response.data ?? {};
        if (transform != null) {
          return Right(transform(data));
        } else if (T == dynamic) {
          return Right(data as T);
        } else {
          return Left(ServerFailure('Invalid response format for $operation'));
        }
      } else {
        return Left(
          ServerFailure(response.message ?? 'Failed to complete $operation'),
        );
      }
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      final errorMessage =
          _getErrorMessageFromResponse(e.response?.data) ??
          e.message ??
          'An error occurred during $operation';

      if (statusCode != null && statusCode >= 500) {
        return Left(ServerFailure('Server error: $errorMessage'));
      } else if (statusCode == 404) {
        return Left(NotFoundFailure('Resource not found'));
      } else if (statusCode == 401 || statusCode == 403) {
        return Left(UnauthorizedFailure('Authentication required'));
      } else {
        return Left(ServerFailure(errorMessage));
      }
    } on FormatException catch (e) {
      return Left(ServerFailure('Data format error: ${e.message}'));
    } on TypeError catch (e) {
      return Left(
        ServerFailure(
          'Type error: ${e.toString()}. Please check the API response format.',
        ),
      );
    } catch (e, stackTrace) {
      if (kDebugMode) {
        log(
          'Unexpected error during $operation',
          error: e,
          stackTrace: stackTrace,
        );
      }
      return Left(
        ServerFailure('An unexpected error occurred during $operation'),
      );
    }
  }

  String? _getErrorMessageFromResponse(dynamic responseData) {
    if (responseData == null) return null;
    if (responseData is Map) {
      return responseData['message']?.toString() ??
          responseData['error']?.toString();
    }
    return responseData.toString();
  }

  @override
  Future<Either<Failure, MembershipRequest>> createMembershipRequest(
    Map<String, dynamic> data,
  ) async {
    final requestData = {
      'membershipTypeId': data['membershipTypeId'],
      'email': data['email'],
      'firstName': data['firstName'],
      'lastName': data['lastName'],
      'phoneNumber': data['phoneNumber'],
      'rollNumber': data['rollNumber'],
      'course': data['course'],
      'degree': data['degree'],
      if (data['avatarUrl'] != null) 'avatarUrl': data['avatarUrl'],
      if (data['notes'] != null && data['notes'].isNotEmpty)
        'notes': data['notes'],
      if (data['roleId'] != null) 'roleId': data['roleId'],
    };

    return _handleApiCall<MembershipRequest>(
      () => _apiService.createMembershipRequest(requestData),
      operation: 'createMembershipRequest',
      transform: (data) => MembershipRequest.fromJson(data),
    );
  }

  @override
  Future<Either<Failure, MembershipRequest>> getMembershipRequest(
    String id,
  ) async {
    return _handleApiCall<MembershipRequest>(
      () => _apiService.getMembershipRequest(id),
      operation: 'getMembershipRequest',
      transform: (data) => MembershipRequest.fromJson(data),
    );
  }

  @override
  Future<Either<Failure, List<MembershipRequest>>> getMembershipRequests({
    String? status,
    int? page,
    int? limit,
  }) async {
    log(
      'Fetching membership requests with status: $status, page: $page, limit: $limit',
    );

    return _handleApiCall<List<MembershipRequest>>(
      () => _apiService.getMembershipRequests(
        status: status,
        page: page,
        limit: limit,
      ),
      operation: 'getMembershipRequests',
      transform: (data) {
        if (data is! List) {
          throw const FormatException('Expected a list of membership requests');
        }
        return data.map((item) => MembershipRequest.fromJson(item)).toList();
      },
    );
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> approveMembershipRequest(
    String requestId, {
    Map<String, dynamic>? data,
  }) {
    return _handleApiCall<Map<String, dynamic>>(
      () => _apiService.approveMembershipRequest(requestId, data ?? {}),
      operation: 'approveMembershipRequest',
      transform: (data) =>
          (data is Map ? Map<String, dynamic>.from(data) : {})
            ..addAll({'message': 'Request approved successfully'}),
    );
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> rejectMembershipRequest(
    String requestId, {
    required String reason,
  }) {
    return _handleApiCall<Map<String, dynamic>>(
      () => _apiService.rejectMembershipRequest(requestId, {'reason': reason}),
      operation: 'rejectMembershipRequest',
      transform: (data) =>
          (data is Map ? Map<String, dynamic>.from(data) : {})
            ..addAll({'message': 'Request rejected successfully'}),
    );
  }

  @override
  Future<Either<Failure, MembershipRequest>> updateMembershipRequest(
    String requestId, {
    required Map<String, dynamic> updates,
  }) {
    return _handleApiCall<MembershipRequest>(
      () => _apiService.updateMembershipRequest(requestId, updates),
      operation: 'updateMembershipRequest',
      transform: (data) => MembershipRequest.fromJson(data),
    );
  }

  @override
  Future<Either<Failure, void>> deleteMembershipRequest(String requestId) {
    return _handleApiCall<void>(
      () => _apiService.deleteMembershipRequest(requestId),
      operation: 'deleteMembershipRequest',
    );
  }
}
