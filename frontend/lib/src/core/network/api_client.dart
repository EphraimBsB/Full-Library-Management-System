import 'package:dio/dio.dart';
import 'package:management_side/src/features/auth/utils/auth_interceptor.dart';
import 'package:management_side/src/features/auth/utils/token_storage.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'api_constants.dart';
import 'api_exceptions.dart';
import 'dart:developer' as developer;

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  late final Dio _dio;

  // final tokenStorage = TokenStorage();

  factory ApiClient() {
    return _instance;
  }

  Future<bool> get isConnected async {
    try {
      final response = await _dio.get('/');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  /// Get the internal Dio instance
  Dio get dio => _dio;

  ApiClient._internal() {
    final tokenStorage = TokenStorage();
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: Duration(milliseconds: ApiConstants.connectTimeout),
        receiveTimeout: Duration(milliseconds: ApiConstants.receiveTimeout),
        headers: {
          ApiConstants.contentType: ApiConstants.applicationJson,
          ApiConstants.accept: ApiConstants.applicationJson,
        },
      ),
    );

    _dio.interceptors.add(AuthInterceptor(tokenStorage, _dio));
    // Add interceptors
    _dio.interceptors.add(
      PrettyDioLogger(
        requestHeader: true,
        requestBody: true,
        responseBody: true,
        responseHeader: true,
        error: true,
        compact: true,
        maxWidth: 90,
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add auth token if available
          // final token = await _authService.getToken();
          // if (token != null) {
          //   options.headers[ApiConstants.authorization] = '${ApiConstants.bearer} $token';
          // }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // Handle 401 Unauthorized
          if (e.response?.statusCode == 401) {
            try {
              // Attempt to refresh token
              // final newToken = await _authService.refreshToken();
              // if (newToken != null) {
              //   // Update the request header
              //   e.requestOptions.headers[ApiConstants.authorization] =
              //       '${ApiConstants.bearer} $newToken';
              //   // Repeat the request
              //   final response = await _dio.fetch(e.requestOptions);
              //   return handler.resolve(response);
              // }
            } on DioException catch (dioError) {
              developer.log('Token refresh failed: ${dioError.message}');
              // If refresh fails, continue with the original error
              return handler.next(e);
            } on Exception catch (error) {
              developer.log('Unexpected error during token refresh: $error');
              // If refresh fails, continue with the original error
              return handler.next(e);
            }
          }
          return handler.next(e);
        },
      ),
    );
  }

  // Generic GET request
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onReceiveProgress: onReceiveProgress,
      );
      return response;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  // Generic POST request
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
        onReceiveProgress: onReceiveProgress,
      );
      return response;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  // Generic PUT request
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
    ProgressCallback? onSendProgress,
    ProgressCallback? onReceiveProgress,
  }) async {
    try {
      final response = await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
        onSendProgress: onSendProgress,
        onReceiveProgress: onReceiveProgress,
      );
      return response;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  // Generic DELETE request
  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    CancelToken? cancelToken,
  }) async {
    try {
      final response = await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
        cancelToken: cancelToken,
      );
      return response;
    } on DioException catch (e) {
      throw _handleDioError(e);
    } catch (e) {
      throw ApiException(message: e.toString());
    }
  }

  // Handle Dio errors
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

  // Handle HTTP error responses
  ApiException _handleResponseError(Response response) {
    final statusCode = response.statusCode;
    final data = response.data;

    String message = 'An error occurred';

    if (data != null && data is Map<String, dynamic>) {
      message = data['message'] ?? data['error'] ?? message;
    }

    switch (statusCode) {
      case 400:
        return BadRequestException(message: message);
      case 401:
        return UnauthorizedException(message: message);
      case 403:
        return ForbiddenException(message: message);
      case 404:
        return NotFoundException(message: message);
      case 422:
        return ValidationException(
          message: 'Validation failed',
          errors: data is Map<String, dynamic>
              ? data['errors'] as Map<String, dynamic>? ?? {}
              : {},
        );
      case 500:
        return ServerException(message: 'Internal server error');
      default:
        return ApiException(
          message: 'Request failed with status: $statusCode',
          statusCode: statusCode,
        );
    }
  }
}
