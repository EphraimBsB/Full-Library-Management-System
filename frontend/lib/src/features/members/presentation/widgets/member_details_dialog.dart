import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';
import 'package:management_side/src/features/student/presentation/providers/student_profile_providers.dart';
import 'package:management_side/src/features/student/presentation/widgets/borrow_history_list.dart';
import 'package:management_side/src/features/student/presentation/widgets/favorites_list.dart';
import 'package:management_side/src/features/student/presentation/widgets/notes_list.dart';
import 'package:management_side/src/features/student/presentation/widgets/profile_summary_card.dart';

class MemberDetailsDialog extends ConsumerStatefulWidget {
  final User member;
  final VoidCallback? onEditPressed;

  const MemberDetailsDialog({
    super.key,
    required this.member,
    this.onEditPressed,
  });

  static void show({
    required BuildContext context,
    required User member,
    VoidCallback? onEdit,
  }) {
    showDialog(
      context: context,
      builder: (context) =>
          MemberDetailsDialog(member: member, onEditPressed: onEdit),
    );
  }

  @override
  ConsumerState<MemberDetailsDialog> createState() =>
      _MemberDetailsDialogState();
}

class _MemberDetailsDialogState extends ConsumerState<MemberDetailsDialog>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  final _tabs = const ['Overview', 'Borrowing', 'Favorites', 'Notes'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _showDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Member'),
        content: const Text(
          'Are you sure you want to delete this member? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              // TODO: Implement delete member functionality
              Navigator.pop(context); // Close delete confirmation
              Navigator.pop(context); // Close member details
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Member deleted successfully')),
              );
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final member = widget.member;
    final theme = Theme.of(context);

    return Dialog(
      child: SizedBox(
        width: 1100,
        height: 760,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 16, 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundImage: member.avatarUrl != null
                        ? NetworkImage(member.avatarUrl!)
                        : const AssetImage('assets/default_avatar.png')
                              as ImageProvider,
                    onBackgroundImageError: (_, __) {
                      // Handle image loading error
                    },
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          member.fullName,
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        if (member.rollNumber != null)
                          Text(
                            member.rollNumber!,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.hintColor,
                            ),
                          ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                    tooltip: 'Close',
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TabBar(
                controller: _tabController,
                isScrollable: true,
                tabs: _tabs.map((t) => Tab(text: t)).toList(),
              ),
            ),
            const SizedBox(height: 8),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _OverviewTab(userId: member.id),
                  BorrowHistoryList(userId: member.id),
                  FavoritesList(userId: member.id),
                  NotesList(userId: member.id),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => _showDeleteConfirmation(context),
                    style: TextButton.styleFrom(foregroundColor: Colors.red),
                    child: const Text('Delete'),
                  ),
                  const SizedBox(width: 8),
                  if (widget.onEditPressed != null)
                    ElevatedButton(
                      onPressed: widget.onEditPressed,
                      child: const Text('Edit'),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OverviewTab extends ConsumerWidget {
  final String userId;

  const _OverviewTab({required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final dateFormat = DateFormat('MMM d, y');
    final profileSummaryAsync = ref.watch(profileSummaryProvider(userId));

    return profileSummaryAsync.when(
      data: (profile) {
        return ListView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          children: [
            ProfileSummaryCard(userId: userId),
            const SizedBox(height: 16),
            Card(
              elevation: 2,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Personal Information',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildInfoRow('Full Name', profile.name),
                    _buildInfoRow('Email', profile.email),
                    if (profile.phoneNumber != null)
                      _buildInfoRow('Phone', profile.phoneNumber ?? 'N/A'),
                    _buildInfoRow('Roll Number', profile.rollNumber),
                    _buildInfoRow('Program', profile.program ?? 'N/A'),
                    _buildInfoRow('Role', profile.role),
                    _buildInfoRow(
                      'Member Since',
                      dateFormat.format(profile.joinedAt),
                    ),
                    _buildInfoRow(
                      'Expiry Date',
                      profile.expiryDate != null
                          ? dateFormat.format(profile.expiryDate!)
                          : 'N/A',
                    ),
                    _buildInfoRow(
                      'Membership Status',
                      profile.membershipStatus,
                    ),
                    _buildInfoRow('Membership Type', profile.membershipType),
                  ],
                ),
              ),
            ),
          ],
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) =>
          Center(child: Text('Error loading member: ${error.toString()}')),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 160,
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
}
