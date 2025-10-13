import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/members/domain/models/membership_model.dart';
import 'package:management_side/src/features/members/presentation/providers/member_provider.dart';
import 'package:management_side/src/features/members/presentation/widgets/member_details_dialog.dart';
import 'package:intl/intl.dart';
import 'package:management_side/src/features/membership/presentation/providers/membership_request_provider.dart';
import 'package:management_side/src/features/membership/presentation/screens/membership_request_detail_screen.dart';
import 'package:management_side/src/features/membership/presentation/screens/membership_request_form_screen.dart';
import 'package:management_side/src/features/membership/presentation/widgets/membership_request_card.dart';

class MemberListScreen extends ConsumerStatefulWidget {
  const MemberListScreen({super.key});

  @override
  ConsumerState<MemberListScreen> createState() => _MemberListScreenState();
}

class _MemberListScreenState extends ConsumerState<MemberListScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedFilter = 'all';
  String _sortBy = 'name';
  bool _sortAscending = true;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _searchController.text.toLowerCase();
    });
  }

  List<Membership> _filterMembers(List<Membership> members) {
    return members.where((member) {
      final user = member.user;
      final matchesSearch =
          user.fullName.toLowerCase().contains(_searchQuery) ||
          user.email.toLowerCase().contains(_searchQuery) ||
          user.rollNumber.toLowerCase().contains(_searchQuery);

      final matchesFilter =
          _selectedFilter == 'all' ||
          (_selectedFilter == 'active' && member.status == 'active');

      return matchesSearch && matchesFilter;
    }).toList()..sort((a, b) {
      int result = 0; // Initialize with a default value
      switch (_sortBy) {
        case 'name':
          result = a.user.fullName.compareTo(b.user.fullName);
          break;
        case 'date':
          result = a.createdAt.compareTo(b.createdAt);
          break;
        case 'course':
          result = (a.user.course ?? '').compareTo(b.user.course ?? '');
          break;
      }
      return _sortAscending ? result : -result;
    });
  }

  void _showMemberDetails(Membership membership) {
    MemberDetailsDialog.show(
      context: context,
      member: membership.user,
      onEdit: () => _showEditMemberDialog(membership),
    );
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter & Sort'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Filter by:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              RadioListTile<String>(
                title: const Text('Active Only'),
                value: 'active',
                groupValue: _selectedFilter,
                onChanged: (value) {
                  if (value != null) {
                    setState(() => _selectedFilter = value);
                  }
                },
              ),
              const Divider(),
              const Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'Sort by:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              _buildSortOption('Name', 'name'),
              _buildSortOption('Join Date', 'date'),
              _buildSortOption('Course', 'course'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _selectedFilter = 'all';
                _sortBy = 'name';
                _sortAscending = true;
                _searchController.clear();
              });
              Navigator.pop(context);
            },
            child: const Text('Reset'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  Widget _buildSortOption(String title, String value) {
    return ListTile(
      title: Text(title),
      leading: Radio<String>(
        value: value,
        groupValue: _sortBy,
        onChanged: (val) {
          if (val != null) {
            setState(() {
              if (_sortBy == value) {
                _sortAscending = !_sortAscending;
              } else {
                _sortBy = value;
                _sortAscending = true;
              }
            });
          }
        },
      ),
      trailing: _sortBy == value
          ? Icon(
              _sortAscending ? Icons.arrow_upward : Icons.arrow_downward,
              size: 16,
            )
          : null,
      onTap: () {
        setState(() {
          if (_sortBy == value) {
            _sortAscending = !_sortAscending;
          } else {
            _sortBy = value;
            _sortAscending = true;
          }
        });
      },
    );
  }

  Widget _buildMemberCard(Membership membership) {
    final user = membership.user;
    final bool isNewMember = membership.createdAt.isAfter(
      DateTime.now().subtract(const Duration(days: 30)),
    );

    return Card(
      elevation: 2,
      child: InkWell(
        onTap: () => _showMemberDetails(membership),
        onLongPress: () => _showEditMemberDialog(membership),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: Theme.of(
                      context,
                    ).primaryColor.withOpacity(0.1),
                    child: Text(
                      user.fullName.isNotEmpty
                          ? user.fullName[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        color: Theme.of(context).primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      user.fullName,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isNewMember ? Colors.green[50] : Colors.red[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      membership.status.toUpperCase(),
                      style: TextStyle(
                        color: isNewMember
                            ? Colors.green[700]
                            : Colors.red[700],
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  // PopupMenuButton<String>(
                  //   onSelected: (value) =>
                  //       _handleMenuSelection(value, membership),
                  //   itemBuilder: (context) => [
                  //     const PopupMenuItem(
                  //       value: 'edit',
                  //       child: Row(
                  //         children: [
                  //           Icon(Icons.edit, size: 20, color: Colors.blue),
                  //           SizedBox(width: 8),
                  //           Text('Edit Member'),
                  //         ],
                  //       ),
                  //     ),
                  //     const PopupMenuItem(
                  //       value: 'delete',
                  //       child: Row(
                  //         children: [
                  //           Icon(Icons.delete, size: 20, color: Colors.red),
                  //           SizedBox(width: 8),
                  //           Text(
                  //             'Delete Member',
                  //             style: TextStyle(color: Colors.red),
                  //           ),
                  //         ],
                  //       ),
                  //     ),
                  //   ],
                  // ),
                ],
              ),
              const SizedBox(height: 12),
              _buildInfoRow(Icons.email, user.email),
              const SizedBox(height: 8),
              if (user.phoneNumber != null) ...[
                _buildInfoRow(Icons.phone, user.phoneNumber!),
                const SizedBox(height: 8),
              ],
              _buildInfoRow(
                Icons.confirmation_number,
                'Roll No: ${user.rollNumber}',
              ),
              const SizedBox(height: 4),
              if (user.degree != null) ...[
                _buildInfoRow(Icons.school, user.degree!),
                const SizedBox(height: 4),
              ],
              _buildInfoRow(
                Icons.calendar_today,
                'Member since ${_formatDate(membership.createdAt)}',
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[800],
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return DateFormat('MMM d, y').format(date);
  }

  Future<void> _handleMenuSelection(String value, Membership membership) async {
    switch (value) {
      case 'edit':
        await _showEditMemberDialog(membership);
        break;
      case 'delete':
        await _confirmDeleteMember(membership);
        break;
    }
  }

  Future<void> _showEditMemberDialog(Membership membership) async {
    // TODO: Implement edit member dialog
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Edit member functionality coming soon')),
      );
    }
  }

  Future<void> _confirmDeleteMember(Membership membership) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Member'),
        content: Text(
          'Are you sure you want to delete ${membership.user.fullName}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('DELETE', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await ref
            .read(memberNotifierProvider.notifier)
            .deleteMembership(membership.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Member deleted successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to delete member: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  // Removed _buildDetailRow as it's no longer needed

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search members...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                contentPadding: const EdgeInsets.symmetric(
                  vertical: 0,
                  horizontal: 16,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilterDialog,
            style: IconButton.styleFrom(
              backgroundColor: Theme.of(context).primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String message,
    String? subMessage,
  }) {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: Theme.of(context).hintColor),
            const SizedBox(height: 16),
            Text(
              message,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Theme.of(context).hintColor,
                fontWeight: FontWeight.w500,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
            if (subMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                subMessage,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Theme.of(context).hintColor.withOpacity(0.8),
                  fontSize: 12,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String message, {required VoidCallback onRetry}) {
    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.errorContainer.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Theme.of(context).colorScheme.error.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 24,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                color: Theme.of(context).colorScheme.error,
                fontSize: 12,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.tonal(
              onPressed: onRetry,
              style: FilledButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.errorContainer,
                foregroundColor: Theme.of(context).colorScheme.onErrorContainer,
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final membersAsync = ref.watch(memberNotifierProvider);
    final membershipRequestsAsync = ref.watch(
      membershipRequestNotifierProvider,
    );

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Library Members'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              showMembershipRequestFormDialog(context);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search Bar
          _buildSearchBar(),

          // Main Content with RefreshIndicator
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                await ref.refresh(memberNotifierProvider.notifier).refresh();
                await ref
                    .refresh(membershipRequestNotifierProvider.notifier)
                    .refresh();
              },
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Pending Requests Section
                    Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      child: Text(
                        'Pending Membership Requests',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                          fontSize: 14,
                        ),
                      ),
                    ),

                    // Membership Requests Grid
                    membershipRequestsAsync.when(
                      data: (requests) {
                        final pendingRequests = requests
                            .where((request) => request.status == 'pending')
                            .toList();
                        if (pendingRequests.isEmpty) {
                          return _buildEmptyState(
                            icon: Icons.person_add_disabled,
                            message: 'No pending membership requests',
                            subMessage:
                                'All caught up! No pending requests at the moment.',
                          );
                        }
                        return Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          height: 280,
                          child: GridView.builder(
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 3,
                                  childAspectRatio: 1.4,
                                  mainAxisSpacing: 16,
                                  crossAxisSpacing: 16,
                                ),
                            itemCount: pendingRequests.length,
                            itemBuilder: (context, index) {
                              final request = pendingRequests[index];
                              return MembershipRequestCard(
                                request: request,
                                onTap: () => showMembershipRequestDialog(
                                  context,
                                  requestId: request.id,
                                ),
                              );
                            },
                          ),
                        );
                      },
                      loading: () => const SizedBox(
                        height: 200,
                        child: Center(child: CircularProgressIndicator()),
                      ),
                      error: (error, stack) => _buildErrorState(
                        'Failed to load requests',
                        onRetry: () => ref
                            .refresh(membershipRequestNotifierProvider.notifier)
                            .refresh(),
                      ),
                    ),

                    // Members Section
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 24, 16, 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Library Members',
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Theme.of(context).colorScheme.primary,
                                  fontSize: 14,
                                ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.filter_list),
                            onPressed: _showFilterDialog,
                            tooltip: 'Filter members',
                          ),
                        ],
                      ),
                    ),

                    // Members Grid
                    membersAsync.when(
                      data: (members) {
                        final filteredMembers = _filterMembers(members);
                        if (filteredMembers.isEmpty) {
                          return _buildEmptyState(
                            icon: Icons.people_outline,
                            message: 'No members found',
                            subMessage:
                                'Try adjusting your search or add a new member',
                          );
                        }
                        return Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          child: GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate:
                                const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 4,
                                  crossAxisSpacing: 16,
                                  mainAxisSpacing: 16,
                                  childAspectRatio: 1.4,
                                ),
                            itemCount: filteredMembers.length,
                            itemBuilder: (context, index) =>
                                _buildMemberCard(filteredMembers[index]),
                          ),
                        );
                      },
                      loading: () => const SizedBox(
                        height: 200,
                        child: Center(child: CircularProgressIndicator()),
                      ),
                      error: (error, stack) => _buildErrorState(
                        'Failed to load members',
                        onRetry: () => ref
                            .refresh(memberNotifierProvider.notifier)
                            .refresh(),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddMemberDialog,
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddMemberDialog() {
    // TODO: Implement add member dialog
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Add member functionality coming soon')),
      );
    }
  }
}
