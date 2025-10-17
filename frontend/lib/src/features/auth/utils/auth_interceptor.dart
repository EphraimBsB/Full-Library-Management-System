// lib/src/features/auth/utils/auth_interceptor.dart
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:management_side/src/features/auth/data/api/auth_api_service.dart';
import 'package:management_side/src/features/auth/domain/models/auth_response.dart';
import 'package:management_side/src/features/auth/utils/token_storage.dart';

class AuthInterceptor extends Interceptor {
  final TokenStorage _tokenStorage;
  final Dio _dio;
  bool _isRefreshing = false;
  final List<({RequestOptions request, ErrorInterceptorHandler handler})>
  _requestsOnHold = [];

  AuthInterceptor(this._tokenStorage, this._dio);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (_shouldSkipAuth(options.path)) {
      return super.onRequest(options, handler);
    }

    final token = await _tokenStorage.getToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return super.onRequest(options, handler);
  }

  bool _shouldSkipAuth(String path) {
    return path.endsWith('/auth/login') ||
        path.endsWith('/auth/register') ||
        path.endsWith('/auth/refresh-token');
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 &&
        err.requestOptions.path != '/auth/refresh-token' &&
        !_isRefreshing) {
      return _handleTokenExpired(err, handler);
    }
    return super.onError(err, handler);
  }

  Future<void> _handleTokenExpired(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    _requestsOnHold.add((request: err.requestOptions, handler: handler));

    if (!_isRefreshing) {
      _isRefreshing = true;
      try {
        final newToken = await _refreshToken();

        if (newToken != null) {
          // Retry all requests on hold with the new token
          await _retryRequests();
        } else {
          // If refresh fails, clear tokens and redirect to login
          await _clearAndRedirect();
        }
      } catch (e) {
        _clearAndRedirect();
      } finally {
        _isRefreshing = false;
      }
    }
  }

  Future<String?> _refreshToken() async {
    try {
      final refreshToken = await _tokenStorage.getRefreshToken();
      if (refreshToken == null) return null;

      final authService = AuthApiService(_dio);
      final response = await authService.refreshToken(
        refreshToken: refreshToken,
      );

      // Save the new tokens
      await _tokenStorage.saveToken(response.accessToken);
      await _tokenStorage.saveRefreshToken(response.refreshToken ?? '');

      return response.accessToken;
    } catch (e) {
      return null;
    }
  }

  Future<void> _retryRequests() async {
    final retryDio = Dio();

    for (var requestData in _requestsOnHold) {
      try {
        final response = await retryDio.request<dynamic>(
          requestData.request.path,
          data: requestData.request.data,
          options: Options(
            method: requestData.request.method,
            headers: {
              ...requestData.request.headers,
              'Authorization': 'Bearer ${await _tokenStorage.getToken()}',
            },
          ),
        );

        requestData.handler.resolve(
          Response(
            requestOptions: requestData.request,
            data: response.data,
            statusCode: response.statusCode,
            statusMessage: response.statusMessage,
            headers: response.headers,
          ),
        );
      } catch (e) {
        requestData.handler.reject(
          DioException(requestOptions: requestData.request, error: e),
        );
      }
    }

    _requestsOnHold.clear();
  }

  Future<void> _clearAndRedirect() async {
    await _tokenStorage.clearTokens();
    // TODO: Navigate to login screen
    // You'll need to handle navigation, possibly using a global navigator key
    // or a state management solution
  }
}

extension on AuthResponse {
  String operator [](String other) {
    return other;
  }
}
