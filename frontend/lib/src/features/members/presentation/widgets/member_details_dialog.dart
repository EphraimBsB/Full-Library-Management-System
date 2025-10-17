import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';

class MemberDetailsDialog extends StatelessWidget {
  final User member;
  final VoidCallback? onEditPressed;

  const MemberDetailsDialog({
    super.key,
    required this.member,
    this.onEditPressed,
  });

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
    final theme = Theme.of(context);
    final dateFormat = DateFormat('MMM d, y');

    return AlertDialog(
      title: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CircleAvatar(
            radius: 30,
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
                Text(
                  member.rollNumber,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.hintColor,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildDetailRow(context, 'Email', member.email),
            if (member.phoneNumber != null)
              _buildDetailRow(context, 'Phone', member.phoneNumber!),
            if (member.course != null)
              _buildDetailRow(context, 'Course', member.course!),
            if (member.degree != null)
              _buildDetailRow(context, 'Degree', member.degree!),
            if (member.dateOfBirth != null)
              _buildDetailRow(
                context,
                'Date of Birth',
                dateFormat.format(member.dateOfBirth!),
              ),
            const SizedBox(height: 8),
            _buildDetailRow(
              context,
              'Member Since',
              dateFormat.format(member.joinDate!),
            ),
            _buildDetailRow(
              context,
              'Status',
              member.isActive ? 'Active' : 'Inactive',
              isHighlighted: true,
              highlightColor: member.isActive ? Colors.green : Colors.grey,
            ),
            if (member.expiryDate != null)
              _buildDetailRow(
                context,
                'Expiry Date',
                dateFormat.format(member.expiryDate!),
                isHighlighted: true,
                highlightColor: member.isActive ? null : Colors.orange,
              ),
            if (member.borrowedBooks?.isNotEmpty ?? false) ...[
              const SizedBox(height: 12),
              Text(
                'Borrowed Books (${member.borrowedBooks!.length}):',
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              ...member.borrowedBooks!.entries.map((entry) {
                final bookTitle = entry.key;
                final dueDate = entry.value;
                final isOverdue = dueDate.isBefore(DateTime.now());
                final dueInDays = dueDate.difference(DateTime.now()).inDays;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 8,
                    ),
                    leading: Container(
                      width: 40,
                      height: 60,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(4),
                        image: const DecorationImage(
                          image: AssetImage('assets/default_book.jpg'),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    title: Text(
                      bookTitle,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    subtitle: Text(
                      'Due: ${dateFormat.format(dueDate)}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isOverdue ? Colors.red : null,
                        fontWeight: isOverdue ? FontWeight.bold : null,
                      ),
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: isOverdue
                            ? Colors.red.shade100
                            : Colors.orange.shade100,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        isOverdue
                            ? 'Overdue ${-dueInDays} days'
                            : 'Due in $dueInDays days',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: isOverdue
                              ? Colors.red.shade800
                              : Colors.orange.shade800,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
        TextButton(
          onPressed: () => _showDeleteConfirmation(context),
          style: TextButton.styleFrom(foregroundColor: Colors.red),
          child: const Text('Delete'),
        ),
        if (onEditPressed != null)
          ElevatedButton(onPressed: onEditPressed, child: const Text('Edit')),
      ],
    );
  }

  Widget _buildDetailRow(
    BuildContext context,
    String label,
    String value, {
    bool isHighlighted = false,
    Color? highlightColor,
  }) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
                color: theme.hintColor,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: isHighlighted
                    ? (highlightColor ?? theme.primaryColor)
                    : null,
                fontWeight: isHighlighted ? FontWeight.bold : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

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
}
