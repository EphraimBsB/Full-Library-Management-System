class ErrorHandler {
  static String getErrorMessage(dynamic error) {
    if (error == null) return 'An unknown error occurred';
    
    // Handle different types of errors here
    if (error is String) return error;
    
    // Add more specific error handling as needed
    return error.toString();
  }
}
