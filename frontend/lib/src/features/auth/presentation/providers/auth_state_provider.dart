import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/auth/domain/models/auth_response.dart';
import 'package:management_side/src/features/auth/utils/token_storage.dart';

class AuthState {
  final AuthResponse? authResponse;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? user;

  const AuthState({
    this.authResponse,
    this.isLoading = false,
    this.error,
    this.user,
  });

  AuthState copyWith({
    AuthResponse? authResponse,
    bool? isLoading,
    String? error,
    Map<String, dynamic>? user,
  }) {
    return AuthState(
      authResponse: authResponse ?? this.authResponse,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      user: user ?? this.user,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final TokenStorage _tokenStorage;

  AuthNotifier(this._tokenStorage) : super(const AuthState()) {
    _loadUserFromStorage();
  }

  Future<void> _loadUserFromStorage() async {
    final token = await _tokenStorage.getToken();
    if (token != null) {
      final userData = await _tokenStorage.getUserData();
      if (userData != null) {
        state = state.copyWith(
          authResponse: AuthResponse(
            accessToken: token,
            refreshToken: await _tokenStorage.getRefreshToken(),
            userData: userData,
          ),
          user: userData,
        );
      }
    }
  }

  Future<void> setAuthResponse(AuthResponse response) async {
    await _tokenStorage.saveToken(response.accessToken);
    if (response.refreshToken != null) {
      await _tokenStorage.saveRefreshToken(response.refreshToken!);
    }
    await _tokenStorage.saveUserData(response.userData);

    if (mounted) {
      state = state.copyWith(
        authResponse: response,
        isLoading: false,
        error: null,
        user: response.userData,
      );
    }
  }

  Future<void> clearAuth() async {
    await _tokenStorage.clearAll();
    if (mounted) {
      state = const AuthState();
    }
  }
}

// Update the provider to inject TokenStorage
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(tokenStorage);
});

final currentUserProvider = Provider<Map<String, dynamic>?>((ref) {
  return ref.watch(authStateProvider).user;
});

// Add this provider to check auth status
final isAuthenticatedProvider = FutureProvider<bool>((ref) async {
  return await tokenStorage.isLoggedIn();
});
