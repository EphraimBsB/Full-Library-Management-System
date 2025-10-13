import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:management_side/src/features/auth/presentation/screens/login_screen.dart';
import 'package:management_side/src/features/auth/utils/token_storage.dart';
import 'package:url_strategy/url_strategy.dart' show setPathUrlStrategy;

// Core
import 'src/core/theme/app_theme.dart';

// Desktop App
import 'src/core/routes/app_routes.dart';
import 'src/core/services/navigation_service.dart';
import 'src/features/dashboard/presentation/screens/dashboard_screen.dart';

// Web App
import 'src/features/student/app.dart' as student_app;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Check authentication status
  final token = await tokenStorage.getToken();
  final isAuthenticated = token != null;

  if (kIsWeb) {
    // For web, use path URL strategy (removes # from URLs)
    setPathUrlStrategy();
    runApp(
      ProviderScope(
        child: student_app.StudentApp(initialAuthState: isAuthenticated),
      ),
    );
  } else {
    // For desktop, use the standard management app
    runApp(
      ProviderScope(
        child: LibraryManagementApp(initialAuthState: isAuthenticated),
      ),
    );
  }
}

class LibraryManagementApp extends StatelessWidget {
  final bool initialAuthState;

  const LibraryManagementApp({super.key, required this.initialAuthState});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ISBAT Library Management',
      debugShowCheckedModeBanner: false,
      navigatorKey: NavigationService.navigatorKey,
      onGenerateRoute: AppRoutes.generateRoute,
      initialRoute: initialAuthState ? AppRoutes.dashboard : AppRoutes.login,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppTheme.primaryColor,
          brightness: Brightness.light,
        ),
        textTheme: GoogleFonts.poppinsTextTheme(Theme.of(context).textTheme),
        appBarTheme: const AppBarTheme(
          backgroundColor: AppTheme.primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: false,
          titleSpacing: 24,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Colors.grey),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(color: Colors.grey),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8),
            borderSide: const BorderSide(
              color: AppTheme.primaryColor,
              width: 2,
            ),
          ),
          filled: true,
          fillColor: Colors.grey[50],
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
          ),
        ),
      ),
      home: initialAuthState ? const DashboardScreen() : const LoginScreen(),
    );
  }
}
