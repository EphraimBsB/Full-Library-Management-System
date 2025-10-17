class ApiConstants {
  // Base URL for the API
  static const String baseUrl = 'http://192.168.2.30:3000/api/v1';

  // Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String books = '/books';
  static const String loans = '/loans';
  static const String members = '/members';
  static const String users = '/users';

  // Timeouts
  static const int receiveTimeout = 15000; // 15 seconds
  static const int connectTimeout = 15000; // 15 seconds

  // Headers
  static const String contentType = 'Content-Type';
  static const String applicationJson = 'application/json';
  static const String authorization = 'Authorization';
  static const String accept = 'accept';
  static const String bearer = 'Bearer';
}
