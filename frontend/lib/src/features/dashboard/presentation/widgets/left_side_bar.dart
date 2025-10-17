import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/auth/utils/token_storage.dart';
import 'package:management_side/src/core/routes/app_routes.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/auth/presentation/providers/auth_state_provider.dart';

class LeftSideBarWidget extends ConsumerStatefulWidget {
  final int currentIndex;
  final Function(int) onItemSelected;

  const LeftSideBarWidget({
    super.key,
    required this.currentIndex,
    required this.onItemSelected,
  });

  @override
  ConsumerState<LeftSideBarWidget> createState() => _LeftSideBarWidgetState();
}

class _LeftSideBarWidgetState extends ConsumerState<LeftSideBarWidget> {
  late int _selectedIndex;
  final List<Map<String, dynamic>> _navigationItems = [
    {
      'icon': Icons.dashboard,
      'label': 'Dashboard',
      'route': AppRoutes.dashboard,
    },
    {'icon': Icons.menu_book, 'label': 'Books', 'route': AppRoutes.books},
    // {
    //   'icon': Icons.request_quote,
    //   'label': 'Loan Requests',
    //   'route': AppRoutes.requests,
    // },
    {'icon': Icons.library_books, 'label': 'Loans', 'route': AppRoutes.loans},
    // {
    //   'icon': Icons.people,
    //   'label': 'Membership Requests',
    //   'route': AppRoutes.membershipRequests,
    // },
    {'icon': Icons.people, 'label': 'Members', 'route': AppRoutes.members},
    {'icon': Icons.settings, 'label': 'Settings', 'route': AppRoutes.settings},
  ];
  @override
  void initState() {
    super.initState();
    _selectedIndex = widget.currentIndex;
  }

  @override
  void didUpdateWidget(LeftSideBarWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.currentIndex != oldWidget.currentIndex) {
      setState(() {
        _selectedIndex = widget.currentIndex;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final user = authState.authResponse;
    return Container(
      width: 264,
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 34),
          // Logo and App Name
          Center(
            child: Column(
              children: [
                Image.asset('assets/logo.png', width: 163),
                const SizedBox(height: 26),
                CircleAvatar(
                  radius: 35,
                  backgroundImage: AssetImage('assets/default_avatar.png'),
                  // foregroundImage: NetworkImage(user?.avatarUrl ?? ''),
                  backgroundColor: AppTheme.backgroundColor,
                ),
                const SizedBox(height: 8),
                Text(
                  user?.fullName ?? 'User',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                ),
                Text(
                  user?.roleName ?? 'Role',
                  style: TextStyle(
                    fontSize: 10,
                    color: AppTheme.textSecondaryColor,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          Divider(color: AppTheme.textSecondaryColor, thickness: 0.5),
          const SizedBox(height: 19),

          // Navigation Items
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              children: _navigationItems.map((item) {
                final index = _navigationItems.indexOf(item);
                final isSelected = _selectedIndex == index;
                return Container(
                  margin: const EdgeInsets.only(bottom: 2),
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFFFF4F2) : null,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    dense: true,
                    leading: Icon(
                      item['icon'],
                      color: isSelected
                          ? AppTheme.primaryColor
                          : const Color(0xFF667085),
                      size: 20,
                    ),
                    title: Text(
                      item['label'],
                      style: TextStyle(
                        color: isSelected
                            ? AppTheme.primaryColor
                            : const Color(0xFF344054),
                        fontSize: 12,
                        fontWeight: isSelected
                            ? FontWeight.w600
                            : FontWeight.normal,
                      ),
                    ),
                    onTap: () {
                      widget.onItemSelected(index);
                    },
                  ),
                );
              }).toList(),
            ),
          ),

          const Spacer(),

          // User Profile
          ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              // vertical: 8,
            ),
            dense: true,
            leading: Icon(Icons.settings_outlined, size: 20),
            title: Text(
              'Settings',
              style: TextStyle(
                color: const Color(0xFF344054),
                fontSize: 12,
                fontWeight: FontWeight.normal,
              ),
            ),
            onTap: () {},
          ),
          ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 24,
              vertical: 8,
            ),
            dense: true,
            leading: Icon(Icons.logout, size: 20),
            title: Text(
              'Log Out',
              style: TextStyle(
                color: const Color(0xFF344054),
                fontSize: 12,
                fontWeight: FontWeight.normal,
              ),
            ),
            onTap: () async {
              //clear all data
              await tokenStorage.clearAll();
              // Clear the auth token
              await tokenStorage.clearToken();

              // Clear the auth state
              if (context.mounted) {
                final authProvider = ref.read(authStateProvider.notifier);
                authProvider.clearAuth();

                // Navigate to login screen and remove all previous routes
                Navigator.of(
                  context,
                ).pushNamedAndRemoveUntil(AppRoutes.login, (route) => false);
              }
            },
          ),
        ],
      ),
    );
  }
}
