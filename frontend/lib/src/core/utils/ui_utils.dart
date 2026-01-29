import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:management_side/src/core/theme/app_theme.dart';

class UiUtils {
  static void showErrorDialog(BuildContext context, dynamic error) {
    String title = 'Error';
    String message = 'An unexpected error occurred';

    if (error is DioException) {
      final data = error.response?.data;
      if (data is Map<String, dynamic>) {
        message = data['message'] ?? data['error'] ?? error.message ?? message;
        if (data['error'] != null) {
          title = data['error'].toString();
        }
      } else {
        message = error.message ?? message;
      }
    } else {
      message = error.toString();
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        title: Row(
          children: [
            const Icon(Icons.error_outline, color: AppTheme.errorColor),
            const SizedBox(width: 8),
            Text(title),
          ],
        ),
        content: Text(message, style: const TextStyle(fontSize: 16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  static void showSnackBar(
    BuildContext context,
    String message, {
    bool isError = false,
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppTheme.errorColor : AppTheme.successColor,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
