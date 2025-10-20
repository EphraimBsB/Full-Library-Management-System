import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/presentation/screens/book_list_screen.dart';
import 'package:management_side/src/features/dashboard/presentation/providers/dashboard_summary_provider.dart';
import 'package:management_side/src/features/dashboard/presentation/widgets/center_main_body.dart';
import 'package:management_side/src/features/dashboard/presentation/widgets/left_side_bar.dart';
import 'package:management_side/src/features/dashboard/presentation/widgets/right_side_bar.dart';
import 'package:management_side/src/features/dashboard/presentation/widgets/topbar.dart';
import 'package:management_side/src/features/loans/presentation/screens/loan_list_screen.dart';
import 'package:management_side/src/features/members/presentation/screens/member_list_screen.dart';
import 'package:management_side/src/features/settings/presentation/screens/settings_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedIndex = 0;
  final PageController _pageController = PageController();

  final List<Widget> _pages = [
    // Dashboard Content
    Column(
      children: [
        const TopbarWidget(),
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Expanded(flex: 3, child: CenterMainBodyWidget()),
              // const SizedBox(width: 16),
              // Right Sidebar with fixed width
              SizedBox(width: 330, child: RightSideBarWidget()),
            ],
          ),
        ),
      ],
    ),
    // Books Content
    const BookListScreen(),
    // Requests Content
    // const RequestsListScreen(),
    // Loans Content
    const LoanListScreen(),
    // Membership Requests Content
    // const MembershipRequestsScreen(),
    // Members Content
    const MemberListScreen(),
    // Settings Content
    const SettingsScreen(),
  ];

  void _onItemSelected(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    ref.invalidate(dashboardSummaryProvider);
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Row(
        children: [
          // Left Sidebar
          LeftSideBarWidget(
            currentIndex: _selectedIndex,
            onItemSelected: _onItemSelected,
          ),

          // Main Content Area
          Expanded(child: _pages[_selectedIndex]),
        ],
      ),
    );
  }
}
