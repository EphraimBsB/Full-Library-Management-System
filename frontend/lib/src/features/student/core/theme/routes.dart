import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:management_side/src/features/student/presentation/screens/student_home_screen.dart';
import 'package:management_side/src/features/student/presentation/screens/student_profile_screen.dart';

class StudentRoutes {
  static const String home = '/';
  static const String profile = 'profile';
  static const String books = 'books';
  static const String bookDetail = 'book/:id';
  static const String notifications = 'notifications';
  static const String settings = 'settings';

  static final router = GoRouter(
    initialLocation: home,
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const StudentHomeScreen(),
        routes: [
          GoRoute(
            path: 'profile',
            builder: (context, state) => const StudentProfileScreen(),
          ),
          // Add more nested routes here
        ],
        // Handle deep linking
        redirect: (context, state) {
          // Add any authentication checks here if needed
          return null; // Return null to proceed with the current route
        },
      ),
    ],
    errorBuilder: (context, state) =>
        Scaffold(body: Center(child: Text('Page not found: ${state.uri}'))),
  );
}
