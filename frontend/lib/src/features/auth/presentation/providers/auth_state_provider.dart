import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/auth/domain/models/auth_response.dart';

class AuthState {
  final AuthResponse? authResponse;
  final bool isLoading;
  final String? error;

  const AuthState({this.authResponse, this.isLoading = false, this.error});

  AuthState copyWith({
    AuthResponse? authResponse,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      authResponse: authResponse ?? this.authResponse,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState());

  void setAuthResponse(AuthResponse response) {
    state = state.copyWith(
      authResponse: response,
      isLoading: false,
      error: null,
    );
  }

  void clearAuth() {
    state = const AuthState();
  }
}

final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});

final currentUserProvider = Provider<AuthResponse?>((ref) {
  return ref.watch(authStateProvider).authResponse;
});
