import 'package:flutter/material.dart';
import 'package:management_side/src/core/data/mock_data.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/dashboard/widgets/topbar.dart';
import 'package:management_side/src/features/members/presentation/widgets/member_details_dialog.dart';
import 'package:management_side/src/features/members/presentation/widgets/member_edit_dialog.dart';
import 'package:management_side/src/features/users/domain/models/user_model.dart';

class MemberListScreen extends StatefulWidget {
  const MemberListScreen({super.key});

  @override
  State<MemberListScreen> createState() => _MemberListScreenState();
}

class _MemberListScreenState extends State<MemberListScreen> {
  final List<User> _allUsers = MockData.mockUsers;
  List<User> _filteredUsers = [];
  final TextEditingController _searchController = TextEditingController();
  String _selectedFilter = 'all';
  String _sortBy = 'name';
  bool _sortAscending = true;

  @override
  void initState() {
    super.initState();
    _filteredUsers = List.from(_allUsers);
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    _applyFilters();
  }

  void _applyFilters() {
    String searchTerm = _searchController.text.toLowerCase();

    setState(() {
      _filteredUsers = _allUsers.where((user) {
        bool matchesSearch =
            user.fullName.toLowerCase().contains(searchTerm) ||
            user.email.toLowerCase().contains(searchTerm) ||
            user.rollNumber.toLowerCase().contains(searchTerm);

        bool matchesFilter =
            _selectedFilter == 'all' ||
            (_selectedFilter == 'active' &&
                user.createdAt.isAfter(
                  DateTime.now().subtract(const Duration(days: 30)),
                ));

        return matchesSearch && matchesFilter;
      }).toList();

      // Apply sorting
      _filteredUsers.sort((a, b) {
        int result;
        switch (_sortBy) {
          case 'name':
            result = a.fullName.compareTo(b.fullName);
            break;
          case 'date':
            result = a.createdAt.compareTo(b.createdAt);
            break;
          case 'course':
            result = (a.course ?? '').compareTo(b.course ?? '');
            break;
          default:
            result = 0;
        }
        return _sortAscending ? result : -result;
      });
    });
  }

  void _showFilterDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Filter & Sort'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Filter by:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            RadioListTile<String>(
              title: const Text('All Members'),
              value: 'all',
              groupValue: _selectedFilter,
              onChanged: (value) {
                setState(() => _selectedFilter = value!);
                _applyFilters();
                Navigator.pop(context);
              },
            ),
            RadioListTile<String>(
              title: const Text('Active (Last 30 days)'),
              value: 'active',
              groupValue: _selectedFilter,
              onChanged: (value) {
                setState(() => _selectedFilter = value!);
                _applyFilters();
                Navigator.pop(context);
              },
            ),
            const Divider(),
            const Text(
              'Sort by:',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            ListTile(
              title: const Text('Name'),
              leading: Radio<String>(
                value: 'name',
                groupValue: _sortBy,
                onChanged: (value) {
                  setState(() => _sortBy = value!);
                  _applyFilters();
                },
              ),
              trailing: _sortBy == 'name'
                  ? Icon(
                      _sortAscending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 16,
                    )
                  : null,
              onTap: () {
                setState(() {
                  if (_sortBy == 'name') {
                    _sortAscending = !_sortAscending;
                  } else {
                    _sortBy = 'name';
                    _sortAscending = true;
                  }
                  _applyFilters();
                });
              },
            ),
            ListTile(
              title: const Text('Join Date'),
              leading: Radio<String>(
                value: 'date',
                groupValue: _sortBy,
                onChanged: (value) {
                  setState(() => _sortBy = value!);
                  _applyFilters();
                },
              ),
              trailing: _sortBy == 'date'
                  ? Icon(
                      _sortAscending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 16,
                    )
                  : null,
              onTap: () {
                setState(() {
                  if (_sortBy == 'date') {
                    _sortAscending = !_sortAscending;
                  } else {
                    _sortBy = 'date';
                    _sortAscending = true;
                  }
                  _applyFilters();
                });
              },
            ),
            ListTile(
              title: const Text('Course'),
              leading: Radio<String>(
                value: 'course',
                groupValue: _sortBy,
                onChanged: (value) {
                  setState(() => _sortBy = value!);
                  _applyFilters();
                },
              ),
              trailing: _sortBy == 'course'
                  ? Icon(
                      _sortAscending
                          ? Icons.arrow_upward
                          : Icons.arrow_downward,
                      size: 16,
                    )
                  : null,
              onTap: () {
                setState(() {
                  if (_sortBy == 'course') {
                    _sortAscending = !_sortAscending;
                  } else {
                    _sortBy = 'course';
                    _sortAscending = true;
                  }
                  _applyFilters();
                });
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() {
                _selectedFilter = 'all';
                _sortBy = 'name';
                _sortAscending = true;
                _searchController.clear();
                _applyFilters();
              });
              Navigator.pop(context);
            },
            child: const Text('Reset'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
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
            style: TextStyle(color: Colors.grey[700], fontSize: 13),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  Future<void> _showAddEditMemberDialog({User? member}) async {
    await showDialog<User>(
      context: context,
      builder: (context) => MemberEditDialog(
        member: member,
        onSave: (updatedMember) {
          setState(() {
            if (member == null) {
              // Add new member
              _allUsers.add(updatedMember);
            } else {
              // Update existing member
              final index = _allUsers.indexWhere((u) => u.id == member.id);
              if (index != -1) {
                _allUsers[index] = updatedMember;
              }
            }
            _applyFilters();
          });
          return updatedMember;
        },
      ),
    );
  }

  void _deleteMember(User member) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Member'),
        content: Text('Are you sure you want to delete ${member.fullName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () {
              setState(() {
                _allUsers.removeWhere((u) => u.id == member.id);
                _applyFilters();
              });
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('${member.fullName} has been deleted'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('DELETE', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Column(
        children: [
          const TopbarWidget(),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 16.0,
              vertical: 8.0,
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: (value) => _applyFilters(),
                    style: const TextStyle(fontSize: 12),
                    decoration: InputDecoration(
                      hintText: 'Search members...',
                      hintStyle: const TextStyle(fontSize: 12),
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8.0),
                      ),
                      contentPadding: const EdgeInsets.symmetric(vertical: 8.0),
                      isDense: true,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.filter_list),
                  onPressed: _showFilterDialog,
                  tooltip: 'Filter & Sort',
                ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 1.4,
                ),
                itemCount: _filteredUsers.length,
                itemBuilder: (context, index) {
                  final user = _filteredUsers[index];
                  return Card(
                    color: AppTheme.backgroundColor,
                    elevation: 2,
                    child: InkWell(
                      onTap: () {
                        showDialog(
                          context: context,
                          builder: (context) => MemberDetailsDialog(member: user),
                        );
                      },
                      onLongPress: () {
                        _showAddEditMemberDialog(member: user);
                      },
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
                                  backgroundImage: NetworkImage(
                                    user.profileImageUrl!,
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
                                    color:
                                        user.createdAt.isAfter(
                                          DateTime.now().subtract(
                                            const Duration(days: 30),
                                          ),
                                        )
                                        ? Colors.green[50]
                                        : Colors.red[50],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    'Active',
                                    style: TextStyle(
                                      color:
                                          user.createdAt.isAfter(
                                            DateTime.now().subtract(
                                              const Duration(days: 30),
                                            ),
                                          )
                                          ? Colors.green[700]
                                          : Colors.red[700],
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                                PopupMenuButton<String>(
                                  onSelected: (value) {
                                    if (value == 'edit') {
                                      _showAddEditMemberDialog(member: user);
                                    } else if (value == 'delete') {
                                      _deleteMember(user);
                                    }
                                  },
                                  itemBuilder: (context) => [
                                    const PopupMenuItem(
                                      value: 'edit',
                                      child: Row(
                                        children: [
                                          Icon(Icons.edit, size: 20, color: Colors.blue),
                                          SizedBox(width: 8),
                                          Text('Edit Member'),
                                        ],
                                      ),
                                    ),
                                    const PopupMenuItem(
                                      value: 'delete',
                                      child: Row(
                                        children: [
                                          Icon(Icons.delete, size: 20, color: Colors.red),
                                          SizedBox(width: 8),
                                          Text('Delete Member'),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
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
                            if (user.degree != null || user.course != null) ...[
                              _buildInfoRow(
                                Icons.school,
                                '${user.degree}${user.degree != null && user.course != null ? ' in ' : ''}${user.course ?? ''}',
                              ),
                              const SizedBox(height: 4),
                            ],
                            _buildInfoRow(
                              Icons.calendar_today,
                              'Member since ${_formatDate(user.createdAt)}',
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // TODO: Implement add member
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
