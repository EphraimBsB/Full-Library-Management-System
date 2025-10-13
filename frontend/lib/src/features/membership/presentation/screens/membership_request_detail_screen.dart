import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/membership/domain/models/membership_request_model.dart';
import 'package:management_side/src/features/membership/presentation/providers/membership_request_provider.dart';

void showMembershipRequestDialog(
  BuildContext context, {
  required String requestId,
}) {
  showDialog(
    context: context,
    builder: (context) => Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 600),
        child: MembershipRequestDialog(requestId: requestId),
      ),
    ),
  );
}

class MembershipRequestDialog extends ConsumerWidget {
  final String requestId;

  const MembershipRequestDialog({Key? key, required this.requestId})
    : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestAsync = ref.watch(singleMembershipRequestProvider(requestId));
    final theme = Theme.of(context);

    return requestAsync.when(
      data: (request) => _buildContent(context, ref, request, theme),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) => _buildErrorWidget(context, ref, error),
    );
  }

  Widget _buildContent(
    BuildContext context,
    WidgetRef ref,
    MembershipRequest request,
    ThemeData theme,
  ) {
    return SingleChildScrollView(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AppBar(
            title: const Text('Request Details'),
            automaticallyImplyLeading: false,
            actions: [
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildDetailRow(
                  'Status',
                  _getStatusText(request.status),
                  theme,
                ),
                const Divider(),
                _buildDetailRow(
                  'Full Name',
                  '${request.user.firstName} ${request.user.lastName}',
                  theme,
                ),
                _buildDetailRow('Email', request.user.email ?? '-', theme),
                if (request.user.phoneNumber != null)
                  _buildDetailRow('Phone', request.user.phoneNumber!, theme),
                if (request.user.degree != null)
                  _buildDetailRow('Degree', request.user.degree!, theme),
                if (request.notes?.isNotEmpty ?? false)
                  _buildDetailRow('Notes', request.notes!, theme),
                if (request.user.profileImageUrl?.isNotEmpty ?? false) ...[
                  const SizedBox(height: 16),
                  Text('Profile Image', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.network(
                      request.user.profileImageUrl!,
                      width: double.infinity,
                      height: 200,
                      fit: BoxFit.cover,
                    ),
                  ),
                ],
                if (request.status == 'pending') ...[
                  const SizedBox(height: 24),
                  _buildActionButtons(context, ref, request),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget(BuildContext context, WidgetRef ref, Object error) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text('Error loading request: $error'),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Close'),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: () {
                  ref.invalidate(singleMembershipRequestProvider(requestId));
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 4),
          Text(value, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }

  Widget _buildActionButtons(
    BuildContext context,
    WidgetRef ref,
    MembershipRequest request,
  ) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () => _showRejectDialog(context, ref, request.id),
            style: OutlinedButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
              side: BorderSide(color: Theme.of(context).colorScheme.error),
            ),
            child: const Text('Reject'),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: FilledButton(
            onPressed: () => _approveRequest(context, ref, request.id),
            child: const Text('Approve'),
          ),
        ),
      ],
    );
  }

  Future<void> _approveRequest(
    BuildContext context,
    WidgetRef ref,
    String requestId,
  ) async {
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    try {
      await ref
          .read(membershipRequestNotifierProvider.notifier)
          .approveMembershipRequest(requestId);
      if (context.mounted) {
        scaffoldMessenger.showSnackBar(
          const SnackBar(content: Text('Membership request approved')),
        );
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (context.mounted) {
        scaffoldMessenger.showSnackBar(
          SnackBar(content: Text('Failed to approve request: $e')),
        );
      }
    }
  }

  Future<void> _showRejectDialog(
    BuildContext context,
    WidgetRef ref,
    String requestId,
  ) async {
    final reasonController = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final scaffoldMessenger = ScaffoldMessenger.of(context);

    return showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Request'),
        content: Form(
          key: formKey,
          child: TextFormField(
            controller: reasonController,
            decoration: const InputDecoration(
              labelText: 'Reason for rejection',
              border: OutlineInputBorder(),
            ),
            maxLines: 3,
            validator: (value) => value?.trim().isEmpty ?? true
                ? 'Please provide a reason'
                : null,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              if (formKey.currentState?.validate() ?? false) {
                try {
                  await ref
                      .read(membershipRequestNotifierProvider.notifier)
                      .rejectMembershipRequest(
                        requestId,
                        reasonController.text.trim(),
                      );
                  if (context.mounted) {
                    scaffoldMessenger.showSnackBar(
                      const SnackBar(
                        content: Text('Membership request rejected'),
                      ),
                    );
                    Navigator.of(context)
                      ..pop()
                      ..pop();
                  }
                } catch (e) {
                  if (context.mounted) {
                    scaffoldMessenger.showSnackBar(
                      SnackBar(content: Text('Failed to reject request: $e')),
                    );
                  }
                }
              }
            },
            child: const Text('Reject'),
          ),
        ],
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  }
}
