import '../network/api_exceptions.dart';

class ErrorHandler {
  static String getErrorMessage(dynamic error) {
    if (error == null) {
      return 'An unknown error occurred';
    }

    // Handle API exceptions with detailed error messages
    if (error is ApiException) {
      return _getApiErrorMessage(error);
    }

    // Handle string errors
    if (error is String) {
      return error;
    }
    return error.toString();
  }

  static String _getApiErrorMessage(ApiException error) {
    if (error.message.isNotEmpty) {
      return error.message;
    }

    switch (error.statusCode) {
      case 400:
        return 'Bad request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not found';
      case 422:
        return 'Validation failed';
      case 500:
        return 'Server error';
      default:
        return 'An error occurred';
    }
  }
}
