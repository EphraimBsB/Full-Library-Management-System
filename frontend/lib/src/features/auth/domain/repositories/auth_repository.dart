import 'package:management_side/src/core/utils/result.dart';
import 'package:management_side/src/features/auth/domain/models/auth_response.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart' as model;

abstract class AuthRepository {
  /// Authenticates a user with email and password
  /// Returns [AuthResponse] containing user data and tokens
  Future<Result<AuthResponse>> login(String email, String password);

  /// Registers a new user
  Future<Result<AuthResponse>> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phoneNumber,
    String? rollNumber,
  });

  /// Gets the currently authenticated user
  Future<Result<model.User>> getCurrentUser();

  /// Logs out the current user
  Future<Result<void>> logout();

  /// Refreshes the access token
  Future<Result<AuthResponse>> refreshToken(String refreshToken);

  /// Initiates password reset
  Future<Result<void>> forgotPassword(String email);

  /// Resets password with a valid token
  Future<Result<void>> resetPassword({
    required String token,
    required String newPassword,
  });
}
