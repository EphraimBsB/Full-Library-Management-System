import 'package:flutter/material.dart';
import 'package:management_side/src/features/auth/presentation/screens/login_screen.dart';
import 'package:management_side/src/features/books/presentation/screens/book_list_screen.dart';
import 'package:management_side/src/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:management_side/src/features/requests/presentation/screens/requests_list_screen.dart';
import 'package:management_side/src/features/settings/presentation/screens/settings_screen.dart';

class AppRoutes {
  static const String login = '/login';
  static const String dashboard = '/';
  static const String books = '/books';
  static const String loans = '/loans';
  static const String members = '/members';
  static const String membershipRequests = '/membership-requests';
  static const String requests = '/requests';
  static const String settings = '/settings';

  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.login:
        return MaterialPageRoute(builder: (_) => const LoginScreen());
      case AppRoutes.dashboard:
        return MaterialPageRoute(builder: (_) => const DashboardScreen());
      case AppRoutes.books:
        return MaterialPageRoute(builder: (_) => const BookListScreen());
      case AppRoutes.requests:
        return MaterialPageRoute(builder: (_) => const RequestsListScreen());
      // case AppRoutes.membershipRequests:
      //   return MaterialPageRoute(
      //     builder: (_) => const MembershipRequestDialog(),
      //   );
      case AppRoutes.settings:
        return MaterialPageRoute(builder: (_) => const SettingsScreen());
      // TODO: Add other routes for loans and members
      default:
        // Redirect to login if route doesn't exist
        return MaterialPageRoute(builder: (_) => const LoginScreen());
    }
  }
}
