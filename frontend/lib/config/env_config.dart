import 'package:flutter_dotenv/flutter_dotenv.dart';

class EnvConfig {
  static Future<void> load() async {
    await dotenv.load(fileName: ".env");
  }

  static String get baseUrl => dotenv.env['BASE_URL'] ?? 'http://localhost:3000/api/v1';
}
