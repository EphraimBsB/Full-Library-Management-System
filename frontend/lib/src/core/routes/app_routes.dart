import 'package:flutter/material.dart';
import 'package:management_side/src/features/books/presentation/screens/book_list_screen.dart';
import 'package:management_side/src/features/dashboard/presentation/dashboard_screen.dart';
import 'package:management_side/src/features/settings/presentation/screens/settings_screen.dart';

class AppRoutes {
  static const String dashboard = '/';
  static const String books = '/books';
  static const String loans = '/loans';
  static const String members = '/members';
  static const String settings = '/settings';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case dashboard:
        return MaterialPageRoute(builder: (_) => const DashboardScreen());
      case books:
        return MaterialPageRoute(builder: (_) => const BookListScreen());
      case AppRoutes.settings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      // TODO: Add other routes for loans and members
      default:
        return MaterialPageRoute(
          builder: (_) => Scaffold(
            body: Center(child: Text('No route defined for ${settings.name}')),
          ),
        );
    }
  }
}
