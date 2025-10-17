import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'package:management_side/src/features/membership/domain/models/membership_request_model.dart';

class MembershipRequestCard extends StatelessWidget {
  final MembershipRequest request;
  final VoidCallback? onTap;

  const MembershipRequestCard({super.key, required this.request, this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final user = request.user;
    final isNewRequest =
        DateTime.now().difference(request.createdAt).inDays < 7;

    Color statusColor;
    switch (request.status.toLowerCase()) {
      case 'approved':
        statusColor = Colors.green;
        break;
      case 'rejected':
        statusColor = Colors.red;
        break;
      case 'pending':
      default:
        statusColor = Colors.orange;
        break;
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with avatar and name
              Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: theme.primaryColor.withValues(alpha: 0.1),
                    child: Text(
                      user.firstName.isNotEmpty
                          ? user.firstName[0].toUpperCase()
                          : '?',
                      style: TextStyle(
                        color: theme.primaryColor,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '${user.firstName} ${user.lastName}'.trim(),
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
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      request.status.toUpperCase(),
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Email
              _buildInfoRow(Icons.email, user.email),
              const SizedBox(height: 8),
              // Phone number if available
              if (user.phoneNumber != null && user.phoneNumber!.isNotEmpty) ...[
                _buildInfoRow(Icons.phone, user.phoneNumber!),
                const SizedBox(height: 8),
              ],
              // Course/Program
              if (user.course != null && user.course!.isNotEmpty) ...[
                _buildInfoRow(Icons.school, user.course!),
                const SizedBox(height: 8),
              ],
              // Roll number
              if (user.rollNumber.isNotEmpty) ...[
                _buildInfoRow(
                  Icons.confirmation_number,
                  'Roll No: ${user.rollNumber}',
                ),
                const SizedBox(height: 8),
              ],
              // Degree if available
              if (user.degree != null && user.degree!.isNotEmpty) ...[
                _buildInfoRow(Icons.workspace_premium, user.degree!),
                const SizedBox(height: 8),
              ],
              // Request date
              _buildInfoRow(
                Icons.calendar_today,
                'Requested: ${_formatDate(request.createdAt)}',
                color: isNewRequest ? theme.primaryColor : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text, {Color? color}) {
    return Row(
      children: [
        Icon(icon, size: 16, color: color ?? Colors.grey[600]),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: color ?? Colors.grey[800],
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
}
