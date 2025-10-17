// lib/src/features/student/presentation/screens/student_profile_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/auth/presentation/providers/auth_state_provider.dart';
import 'package:management_side/src/features/student/core/theme/routes.dart'
    as student_routes;
import 'package:management_side/src/features/student/presentation/providers/student_profile_providers.dart'
    hide userLoansProvider;
import 'package:management_side/src/features/student/presentation/widgets/borrow_history_list.dart';
import 'package:management_side/src/features/student/presentation/widgets/favorites_list.dart';
import 'package:management_side/src/features/student/presentation/widgets/notes_list.dart';
import 'package:management_side/src/features/student/presentation/widgets/profile_summary_card.dart';

class StudentProfileScreen extends ConsumerStatefulWidget {
  const StudentProfileScreen({super.key});

  @override
  ConsumerState<StudentProfileScreen> createState() =>
      _StudentProfileScreenState();
}

class _StudentProfileScreenState extends ConsumerState<StudentProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _scrollController = ScrollController();
  final _tabs = const ['Profile', 'Borrowing', 'Favorites', 'Notes'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    if (user == null) {
      return const Center(child: Text('Please sign in to view your profile'));
    }

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('My Profile'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/'),
        ),
      ),
      body: NestedScrollView(
        controller: _scrollController,
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverToBoxAdapter(child: ProfileSummaryCard(userId: user['id'])),
            SliverPersistentHeader(
              pinned: true,
              delegate: _SliverAppBarDelegate(
                TabBar(
                  controller: _tabController,
                  dividerColor: AppTheme.surfaceColor,
                  overlayColor: WidgetStateProperty.all(AppTheme.surfaceColor),
                  isScrollable: true,
                  labelColor: Theme.of(context).primaryColor,
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: Theme.of(context).primaryColor,
                  tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildProfileTab(user),
            BorrowHistoryList(userId: user['id']),
            FavoritesList(userId: user['id']),
            NotesList(userId: user['id']),
          ],
        ),
      ),
    );
  }

  // Tab Content Builders
  Widget _buildProfileTab(Map<String, dynamic> user) {
    final profileSummaryAsync = ref.watch(profileSummaryProvider(user['id']));
    return profileSummaryAsync.when(
      data: (profile) => ListView(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
        children: [
          _buildInfoCard(
            title: 'Personal Information',
            children: [
              _buildInfoRow('Full Name', profile.name),
              _buildInfoRow('Email', profile.email),
              if (profile.phoneNumber != null)
                _buildInfoRow('Phone', profile.phoneNumber ?? 'N/A'),
              _buildInfoRow('Student ID', profile.rollNumber),
              _buildInfoRow('Program', profile.program ?? 'N/A'),
              _buildInfoRow('Member Since', '${profile.joinedAt.year}'),
              _buildInfoRow(
                'Expiry Date',
                profile.expiryDate?.year.toString() ?? 'N/A',
              ),
              _buildInfoRow('Membership Status', profile.membershipStatus),
              _buildInfoRow('Membership Type', profile.membershipType),
            ],
          ),
          const SizedBox(height: 16),
          _buildInfoCard(
            title: 'Account Settings',
            children: [
              _buildListTile(
                icon: Icons.edit,
                title: 'Edit Profile',
                onTap: () => _showEditProfileDialog(context, user),
              ),
              _buildListTile(
                icon: Icons.lock_outline,
                title: 'Change Password',
                onTap: () => _showChangePasswordDialog(context),
              ),
              _buildListTile(
                icon: Icons.notifications_none,
                title: 'Notification Settings',
                onTap: () {},
              ),
              _buildListTile(
                icon: Icons.logout,
                title: 'Logout',
                onTap: () {
                  ref.read(authStateProvider.notifier).clearAuth();
                  context.go(student_routes.StudentRoutes.home);
                },
              ),
            ],
          ),
        ],
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) =>
          Center(child: Text('Error loading profile: ${error.toString()}')),
    );
  }

  // Helper Widgets
  Widget _buildInfoCard({
    required String title,
    required List<Widget> children,
  }) {
    return Card(
      elevation: 2,
      color: AppTheme.surfaceColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            ...children,
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 170,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).primaryColor),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  // Dialog Methods
  void _showEditProfileDialog(BuildContext context, Map<String, dynamic> user) {
    // Implement edit profile dialog
  }

  void _showChangePasswordDialog(BuildContext context) {
    // Implement change password dialog
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;

  _SliverAppBarDelegate(this._tabBar);

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: _tabBar,
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
