import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/auth/presentation/providers/auth_state_provider.dart';
import 'package:management_side/src/features/auth/presentation/screens/login_screen.dart';
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

  // For web, use path URL strategy (removes # from URLs)
  if (kIsWeb) {
    setPathUrlStrategy();
  }

  // Initialize the app with ProviderScope
  runApp(ProviderScope(child: const MyApp()));
}

class MyApp extends ConsumerStatefulWidget {
  const MyApp({super.key});

  @override
  ConsumerState<MyApp> createState() => _MyAppState();
}

class _MyAppState extends ConsumerState<MyApp> {
  bool _isLoading = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    final isLoggedIn = await ref.read(isAuthenticatedProvider.future);
    setState(() {
      _isAuthenticated = isLoggedIn;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const MaterialApp(
        debugShowCheckedModeBanner: false,
        home: Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    if (kIsWeb) {
      return student_app.StudentApp(initialAuthState: _isAuthenticated);
    }

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Library Management System',
      theme: AppTheme.lightTheme,
      themeMode: ThemeMode.system,
      navigatorKey: NavigationService.navigatorKey,
      onGenerateRoute: AppRoutes.generateRoute,
      home: _isAuthenticated ? const DashboardScreen() : const LoginScreen(),
    );
  }
}
