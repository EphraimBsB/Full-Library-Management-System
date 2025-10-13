import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:management_side/src/features/auth/utils/token_storage.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/auth/presentation/providers/auth_state_provider.dart';
import 'presentation/screens/student_home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize token storage
  final token = await tokenStorage.getToken();

  runApp(ProviderScope(child: StudentApp(initialAuthState: token != null)));
}

class StudentApp extends ConsumerWidget {
  final bool initialAuthState;

  const StudentApp({super.key, required this.initialAuthState});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch auth state changes
    final authState = ref.watch(authStateProvider);
    final isAuthenticated = authState.authResponse != null;

    // If user logs out, navigate to login screen
    if (!isAuthenticated && initialAuthState) {
      // WidgetsBinding.instance.addPostFrameCallback((_) {
      //   Navigator.of(
      //     context,
      //   ).pushNamedAndRemoveUntil('/login', (route) => false);
      // });
    }

    return MaterialApp(
      title: 'ISBAT LMS - Student Portal',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: AppTheme.primaryColor,
          brightness: Brightness.light,
        ),
        textTheme: GoogleFonts.poppinsTextTheme(Theme.of(context).textTheme),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.black,
          elevation: 0,
          centerTitle: false,
          titleSpacing: 24,
          toolbarHeight: 80,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: AppTheme.primaryColor,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(
            foregroundColor: Colors.black87,
            textStyle: const TextStyle(fontWeight: FontWeight.w500),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(28),
            borderSide: BorderSide.none,
          ),
          filled: true,
          fillColor: Colors.grey[100],
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 16,
          ),
        ),
      ),
      // Use a builder to handle initial route
      home: const StudentHomeScreen(),
    );
  }
}
