import 'package:dio/dio.dart';
import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/core/utils/result.dart';
import 'package:management_side/src/features/auth/data/api/auth_api_service.dart';
import 'package:management_side/src/features/auth/domain/models/auth_response.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart'
    as model;
import 'package:management_side/src/features/auth/domain/repositories/auth_repository.dart';

class AuthRepositoryImpl extends BaseRepository implements AuthRepository {
  final AuthApiService _apiService;

  AuthRepositoryImpl({Dio? dio})
    : _apiService = AuthApiService(dio ?? ApiClient().dio);

  @override
  Future<Result<AuthResponse>> login(String email, String password) async {
    return handleApiCall<AuthResponse>(
      () => _apiService.login(email: email, password: password),
      errorMessage: 'Login failed. Please check your credentials.',
    );
  }

  @override
  Future<Result<AuthResponse>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phoneNumber,
    String? rollNumber,
  }) async {
    return handleApiCall<AuthResponse>(
      () => _apiService.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: phoneNumber,
        rollNumber: rollNumber,
      ),
      errorMessage: 'Registration failed. Please try again.',
    );
  }

  @override
  Future<Result<AuthResponse>> refreshToken(String refreshToken) async {
    return handleApiCall<AuthResponse>(
      () => _apiService.refreshToken(refreshToken: refreshToken),
      errorMessage: 'Failed to refresh token. Please log in again.',
    );
  }

  @override
  Future<Result<model.User>> getCurrentUser() async {
    return handleApiCall<model.User>(
      () => _apiService.getCurrentUser(),
      errorMessage: 'Failed to fetch user data.',
    );
  }

  @override
  Future<Result<void>> logout() async {
    return handleApiCall<void>(
      () => _apiService.logout(),
      errorMessage: 'Failed to log out. Please try again.',
    );
  }

  @override
  Future<Result<void>> forgotPassword(String email) async {
    return handleApiCall<void>(
      () => _apiService.forgotPassword(email: email),
      errorMessage: 'Failed to send password reset email.',
    );
  }

  @override
  Future<Result<void>> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    return handleApiCall<void>(
      () => _apiService.resetPassword(token: token, password: newPassword),
      errorMessage: 'Failed to reset password. Please try again.',
    );
  }
}
