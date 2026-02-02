import 'dart:async';

import 'package:dio/dio.dart';

import '../network/api_client.dart';
import '../network/api_exceptions.dart';
import '../utils/result.dart';

/// A base repository class that provides common API operations
abstract class BaseRepository {
  final ApiClient _apiClient = ApiClient();

  /// Handles API calls and wraps the response in a Result
  Future<Result<T>> handleApiCall<T>(
    Future<T> Function() apiCall, {
    String? errorMessage,
  }) async {
    try {
      final result = await apiCall();
      return Success(result);
    } on DioException catch (e) {
      // Convert DioException to ApiException using the same logic as ApiClient
      final apiException = _handleDioError(e);
      return Failure(apiException);
    } on ApiException catch (e) {
      return Failure(e);
    } catch (e, stackTrace) {
      return Failure(
        ApiException(message: errorMessage ?? 'An unexpected error occurred'),
        stackTrace,
      );
    }
  }

  // Handle Dio errors (copied from ApiClient)
  ApiException _handleDioError(dynamic error) {
    if (error is DioException) {
      switch (error.type) {
        case DioExceptionType.connectionTimeout:
          return ApiException(message: 'Connection timeout');
        case DioExceptionType.sendTimeout:
          return ApiException(message: 'Send timeout');
        case DioExceptionType.receiveTimeout:
          return ApiException(message: 'Receive timeout');
        case DioExceptionType.badCertificate:
          return ApiException(message: 'Bad certificate');
        case DioExceptionType.badResponse:
          return _handleResponseError(error.response!);
        case DioExceptionType.cancel:
          return ApiException(message: 'Request cancelled');
        case DioExceptionType.connectionError:
          return ApiException(message: 'Connection error');
        case DioExceptionType.unknown:
          return ApiException(message: 'Unknown error occurred');
      }
    }
    return ApiException(message: error.toString());
  }

  // Handle HTTP error responses (copied from ApiClient)
  ApiException _handleResponseError(Response response) {
    final statusCode = response.statusCode;
    final data = response.data;

    String message = 'An error occurred';
    dynamic originalData = data;

    if (data != null && data is Map<String, dynamic>) {
      // Handle different error message formats
      if (data['message'] != null) {
        if (data['message'] is List) {
          // Handle array of messages
          message = (data['message'] as List).join(', ');
        } else {
          message = data['message'].toString();
        }
      } else if (data['error'] != null) {
        message = data['error'].toString();
      }
    }

    switch (statusCode) {
      case 400:
        return BadRequestException(message: message, data: originalData);
      case 401:
        return UnauthorizedException(message: message, data: originalData);
      case 403:
        return ForbiddenException(message: message, data: originalData);
      case 404:
        return NotFoundException(message: message, data: originalData);
      case 422:
        return ValidationException(
          message: 'Validation failed',
          errors: data is Map<String, dynamic>
              ? data['errors'] as Map<String, dynamic>? ?? {}
              : {},
          data: originalData,
        );
      case 500:
        return ServerException(
          message: 'Internal server error',
          data: originalData,
        );
      default:
        return ApiException(
          message: 'Request failed with status: $statusCode',
          statusCode: statusCode,
          data: originalData,
        );
    }
  }

  /// Handles GET requests
  Future<Result<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    String? errorMessage,
  }) async {
    return handleApiCall<T>(() async {
      final response = await _apiClient.get(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data as T;
    }, errorMessage: errorMessage);
  }

  /// Handles POST requests
  Future<Result<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    String? errorMessage,
  }) async {
    return handleApiCall<T>(() async {
      final response = await _apiClient.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data as T;
    }, errorMessage: errorMessage);
  }

  /// Handles PUT requests
  Future<Result<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    String? errorMessage,
  }) async {
    return handleApiCall<T>(() async {
      final response = await _apiClient.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data as T;
    }, errorMessage: errorMessage);
  }

  /// Handles DELETE requests
  Future<Result<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    String? errorMessage,
  }) async {
    return handleApiCall<T>(() async {
      final response = await _apiClient.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response.data as T;
    }, errorMessage: errorMessage);
  }

  /// Handles paginated GET requests
  Future<Result<PaginatedResponse<T>>> getPaginated<T>(
    String path, {
    required int page,
    required int limit,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    String? errorMessage,
  }) async {
    final params = {'page': page, 'limit': limit, ...?queryParameters};

    return get<Map<String, dynamic>>(
      path,
      queryParameters: params,
      options: options,
      cancelToken: cancelToken,
      errorMessage: errorMessage,
    ).then((result) {
      return result.mapSuccess((data) {
        return PaginatedResponse<T>.fromJson(data, (json) => json as T);
      });
    });
  }
}

/// A generic class for paginated responses
class PaginatedResponse<T> {
  final List<T> items;
  final int currentPage;
  final int totalPages;
  final int totalItems;
  final int itemsPerPage;
  final bool hasNextPage;
  final bool hasPreviousPage;

  // Private constructor for creating a paginated response
  PaginatedResponse({
    required this.items,
    required this.currentPage,
    required this.totalPages,
    required this.totalItems,
    required this.itemsPerPage,
  }) : hasNextPage = currentPage < totalPages,
       hasPreviousPage = currentPage > 1;

  /// Creates an empty paginated response
  factory PaginatedResponse.empty() {
    return PaginatedResponse<T>(
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 10,
    );
  }

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic) fromJsonT,
  ) {
    try {
      // First, try to get the items from the 'items' field (current backend response format)
      // If 'items' doesn't exist, try 'data' (expected format)
      final List<dynamic> dataList =
          (json['items'] as List<dynamic>?) ??
          (json['data'] as List<dynamic>? ?? []);

      // Get pagination metadata with fallback values
      final int total = json['total'] ?? 0;
      final int currentPage = json['page'] ?? 1;
      final int itemsPerPage =
          json['limit'] ?? (dataList.isNotEmpty ? dataList.length : 10);
      final int totalPages =
          json['totalPages'] ??
          (itemsPerPage > 0 ? (total / itemsPerPage).ceil() : 1);

      // Convert each item in the data list to the specified type
      final items = dataList.map((item) => fromJsonT(item)).toList();

      return PaginatedResponse<T>(
        items: items,
        currentPage: currentPage,
        totalPages: totalPages,
        totalItems: total,
        itemsPerPage: itemsPerPage,
      );
    } catch (e, stackTrace) {
      // Log the error and return an empty response
      print('Error parsing paginated response: $e');
      print('Stack trace: $stackTrace');
      print('Response JSON: $json');

      return PaginatedResponse<T>.empty();
    }
  }

  PaginatedResponse<U> map<U>(U Function(T) toElement) {
    return PaginatedResponse<U>(
      items: items.map(toElement).toList(),
      currentPage: currentPage,
      totalPages: totalPages,
      totalItems: totalItems,
      itemsPerPage: itemsPerPage,
    );
  }
}
