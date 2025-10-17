import 'package:flutter/material.dart';
import 'package:management_side/src/features/auth/presentation/providers/auth_state_provider.dart';
import 'package:management_side/src/features/auth/presentation/widgets/login_dialog.dart';
import 'package:management_side/src/core/widgets/error_view.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Checks if user is authenticated, shows login dialog if not
/// Returns true if user is authenticated or successfully logged in
Future<bool> ensureAuthenticated(
  BuildContext context, {
  String message = 'Please log in to continue',
  VoidCallback? onAuthenticated,
}) async {
  final authState = ProviderScope.containerOf(context, listen: false)
      .read(authStateProvider);

  // If user is already authenticated
  if (authState.authResponse != null) {
    onAuthenticated?.call();
    return true;
  }

  // Show login dialog if not authenticated
  final result = await showLoginDialog(
    context,
    message: message,
  );

  // If login was successful, call the callback
  if (result == true) {
    onAuthenticated?.call();
  }

  return result;
}

/// Shows an error dialog for authentication failures
void showAuthError(BuildContext context, {String? message}) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      title: const Text('Authentication Required'),
      content: Text(message ?? 'You need to be logged in to perform this action.'),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('OK'),
        ),
      ],
    ),
  );
}
