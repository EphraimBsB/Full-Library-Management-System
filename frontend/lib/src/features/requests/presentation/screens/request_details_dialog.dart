import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/loans/presentation/providers/loan_provider.dart';
import 'package:management_side/src/features/requests/domain/models/book_request_model.dart';
import 'package:management_side/src/features/requests/presentation/providers/book_request_provider.dart';
import 'package:management_side/src/features/requests/presentation/providers/pending_requests_provider.dart';
import 'package:management_side/src/features/requests/presentation/widgets/show_confirmation_dialog.dart';
import 'package:management_side/src/features/dashboard/presentation/providers/dashboard_summary_provider.dart';
import 'package:management_side/src/features/books/presentation/providers/book_details_provider.dart';
import 'package:management_side/src/features/loans/presentation/utils/loan_cache_invalidation.dart';

class RequestDetailsDialog extends ConsumerStatefulWidget {
  final BookRequest request;
  final VoidCallback? onApproved;
  final VoidCallback? onRejected;
  final VoidCallback? onCancelled;
  final bool isAdmin;

  const RequestDetailsDialog({
    super.key,
    required this.request,
    this.onApproved,
    this.onRejected,
    this.onCancelled,
    this.isAdmin = true,
  });

  static Future<String?> show(
    BuildContext context, {
    required BookRequest request,
    bool isAdmin = true,
    VoidCallback? onApproved,
    VoidCallback? onRejected,
    VoidCallback? onCancelled,
  }) async {
    return showDialog<String>(
      context: context,
      builder: (context) => RequestDetailsDialog(
        request: request,
        isAdmin: isAdmin,
        onApproved: onApproved,
        onRejected: onRejected,
        onCancelled: onCancelled,
      ),
    );
  }

  @override
  ConsumerState<RequestDetailsDialog> createState() =>
      _RequestDetailsDialogState();
}

class _RequestDetailsDialogState extends ConsumerState<RequestDetailsDialog> {
  bool _isApproving = false;
  bool _isRejecting = false;
  final _notesController = TextEditingController();
  String? _selectedCopyId;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Widget _buildAvailableCopiesSection(List<dynamic>? copies) {
    if (copies == null || copies.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey[100],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: Row(
          children: [
            Icon(Icons.info_outline, size: 16, color: Colors.grey[600]),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'No copies available',
                style: TextStyle(color: Colors.grey[600], fontSize: 12),
              ),
            ),
          ],
        ),
      );
    }

    final availableCopies = copies
        .where((copy) => copy['status'] == 'AVAILABLE')
        .toList();

    if (availableCopies.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.orange[50],
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.orange[200]!),
        ),
        child: Row(
          children: [
            Icon(
              Icons.warning_amber_outlined,
              size: 16,
              color: Colors.orange[600],
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'No available copies',
                style: TextStyle(color: Colors.orange[600], fontSize: 12),
              ),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Improved title with count
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.library_books_outlined,
              size: 16,
              color: Theme.of(context).primaryColor,
            ),
            const SizedBox(width: 6),
            Flexible(
              child: Text(
                'Available Copies (${availableCopies.length}):',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: Theme.of(context).primaryColor,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),

        // Improved Wrap with better spacing and constraints
        Container(
          constraints: const BoxConstraints(maxHeight: 120),
          child: SingleChildScrollView(
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: availableCopies.map((copy) {
                final isSelected = _selectedCopyId == copy['id'].toString();
                return ChoiceChip(
                  label: ConstrainedBox(
                    constraints: const BoxConstraints(minWidth: 60),
                    child: Text(
                      '#${copy['accessNumber']}',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: isSelected
                            ? FontWeight.bold
                            : FontWeight.normal,
                      ),
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      _selectedCopyId = selected ? copy['id'].toString() : null;
                    });
                  },
                  selectedColor: Theme.of(
                    context,
                  ).primaryColor.withOpacity(0.15),
                  pressElevation: 2,
                  side: BorderSide(
                    color: isSelected
                        ? Theme.of(context).primaryColor
                        : Colors.grey[400]!,
                    width: isSelected ? 1.5 : 1,
                  ),
                  labelStyle: TextStyle(
                    color: isSelected
                        ? Theme.of(context).primaryColor
                        : Colors.grey[700],
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                );
              }).toList(),
            ),
          ),
        ),

        const SizedBox(height: 8),

        // Improved instruction text
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            children: [
              Icon(Icons.touch_app_outlined, size: 12, color: Colors.blue[600]),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  "Select a copy to approve this request",
                  style: TextStyle(
                    color: Colors.blue[600],
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _handleApprove() async {
    if (_selectedCopyId == null) {
      if (mounted) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            title: const Text('Selection Required'),
            content: const Text('Please select a copy to approve this request'),
            actions: [
              TextButton(
                onPressed: Navigator.of(context).pop,
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
      return;
    }

    final confirmed = await showConfirmationDialog(
      context: context,
      title: 'Approve Request',
      content:
          'Are you sure you want to approve this book request with the selected copy?',
      confirmButtonText: 'APPROVE',
      confirmButtonColor: Colors.green,
      notesHint: 'Add any notes about this approval...',
      notesController: _notesController,
    );

    if (!confirmed) return;

    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      setState(() => _isApproving = true);

      final repository = ref.read(bookRequestRepositoryProvider);
      final result = await repository.approveBookRequest(
        requestId: widget.request.id!,
        preferredCopyId: _selectedCopyId,
        notes: _notesController.text.trim().isNotEmpty
            ? _notesController.text
            : null,
      );

      if (!mounted) return;

      result.fold(
        (failure) {
          scaffoldMessenger.showSnackBar(
            SnackBar(
              content: Text(failure.message),
              backgroundColor: Colors.red,
            ),
          );
        },
        (response) {
          // Instant local update
          ref
              .read(pendingRequestsNotifierProvider.notifier)
              .removeRequest(widget.request.id!);

          // Refresh loans list in background
          ref.read(loanNotifierProvider.notifier).loadLoans();

          // Use comprehensive loan cache invalidation
          LoanCacheInvalidator.invalidateAllLoanCaches(
            userId: widget.request.user!['id'].toString(),
          );

          // Invalidate dashboard summary to refresh stats
          ref.invalidate(dashboardSummaryProvider);

          // Invalidate book details if book ID is available
          if (widget.request.book != null &&
              widget.request.book!['id'] != null) {
            final bookId = widget.request.book!['id'] as int;
            ref.invalidate(bookDetailsProvider(bookId));
          }

          scaffoldMessenger.showSnackBar(
            const SnackBar(
              content: Text('Request approved successfully'),
              backgroundColor: Colors.green,
            ),
          );
          navigator.pop('APPROVED');
          if (widget.onApproved != null) widget.onApproved!();
        },
      );
    } catch (e) {
      if (!mounted) return;
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('An error occurred: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isApproving = false);
        _notesController.clear();
      }
    }
  }

  Future<void> _handleReject() async {
    final confirmed = await showConfirmationDialog(
      context: context,
      title: 'Reject Request',
      content: 'Are you sure you want to reject this book request?',
      confirmButtonText: 'REJECT',
      confirmButtonColor: Colors.red,
      notesHint: 'Please provide a reason for rejection...',
      notesController: _notesController,
    );

    if (!confirmed) return;

    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);

    try {
      setState(() => _isRejecting = true);

      final repository = ref.read(bookRequestRepositoryProvider);
      final result = await repository.rejectBookRequest(
        requestId: widget.request.id!,
        notes: _notesController.text.trim().isNotEmpty
            ? _notesController.text
            : 'No reason provided',
      );

      if (!mounted) return;

      result.fold(
        (failure) {
          scaffoldMessenger.showSnackBar(
            SnackBar(
              content: Text(failure.message),
              backgroundColor: Colors.red,
            ),
          );
        },
        (_) {
          // Instant local update
          ref
              .read(pendingRequestsNotifierProvider.notifier)
              .removeRequest(widget.request.id!);

          // Use comprehensive loan cache invalidation
          LoanCacheInvalidator.invalidateAllLoanCaches(
            userId: widget.request.user!['id'].toString(),
          );

          // Invalidate dashboard summary to refresh stats
          ref.invalidate(dashboardSummaryProvider);

          // Invalidate book details if book ID is available
          if (widget.request.book != null &&
              widget.request.book!['id'] != null) {
            final bookId = widget.request.book!['id'] as int;
            ref.invalidate(bookDetailsProvider(bookId));
          }

          scaffoldMessenger.showSnackBar(
            const SnackBar(
              content: Text('Request rejected'),
              backgroundColor: Colors.green,
            ),
          );
          navigator.pop('REJECTED');
          if (widget.onRejected != null) widget.onRejected!();
        },
      );
    } catch (e) {
      if (!mounted) return;
      scaffoldMessenger.showSnackBar(
        SnackBar(
          content: Text('An error occurred: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isRejecting = false);
        _notesController.clear();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final book = widget.request.book;
    final user = widget.request.user;
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: size.width * 0.6,
          maxHeight: size.height * 0.9,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Padding(
                  padding: const EdgeInsets.only(left: 20.0, top: 16.0),
                  child: Text(
                    'Request Details',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const Spacer(),
                Padding(
                  padding: const EdgeInsets.only(right: 12.0, top: 12.0),
                  child: IconButton(
                    icon: const Icon(Icons.close),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.grey[300],
                      foregroundColor: Colors.white,
                      shape: const CircleBorder(),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            // Scrollable content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (book != null) ...[
                      _buildSection(
                        context,
                        title: 'Book Information',
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: CachedNetworkImage(
                                imageUrl:
                                    book['coverImageUrl'] ??
                                    'assets/default_book.jpg',
                                height: 230,
                                fit: BoxFit.cover,
                                errorWidget: (context, url, error) =>
                                    Image.asset('assets/default_book.jpg'),
                                placeholder: (context, url) =>
                                    const CircularProgressIndicator(),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildDetailRow(
                                    'Title',
                                    book['title'] ?? 'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Author',
                                    book['author'] ?? 'N/A',
                                  ),
                                  _buildDetailRow(
                                    'ISBN',
                                    book['isbn'] ?? 'N/A',
                                  ),
                                  _buildDetailRow('DDC', book['ddc'] ?? 'N/A'),
                                  _buildDetailRow(
                                    'Publisher',
                                    book['publisher'] ?? 'N/A',
                                  ),
                                  const SizedBox(height: 8),
                                  if (widget.isAdmin &&
                                      widget.request.status == 'PENDING')
                                    _buildAvailableCopiesSection(
                                      book['copies'],
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    if (user != null) ...[
                      _buildSection(
                        context,
                        title: 'Requester Information',
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: CachedNetworkImage(
                                imageUrl:
                                    user['profileImageUrl'] ??
                                    'assets/default_avatar.png',
                                height: 150,
                                width: 150,
                                fit: BoxFit.cover,
                                errorWidget: (context, url, error) =>
                                    Image.asset('assets/default_avatar.png'),
                                placeholder: (context, url) =>
                                    const CircularProgressIndicator(),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildDetailRow(
                                    'Name',
                                    '${user['firstName']} ${user['lastName']}',
                                  ),
                                  _buildDetailRow(
                                    'Roll Number',
                                    user['rollNumber'] ?? 'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Phone',
                                    user['phoneNumber'] ?? 'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Email',
                                    user['email'] ?? 'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Degree',
                                    user['degree'] ?? 'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Course',
                                    user['course'] ?? 'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Joined Date',
                                    user['joinDate'] ?? 'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Active Loan Count',
                                    user['activeLoansCount'].toString(),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],
                    _buildSection(
                      context,
                      title: 'Request Details',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildDetailRow(
                            'Status',
                            widget.request.status ?? 'N/A',
                            isStatus: true,
                          ),
                          _buildDetailRow(
                            'Requested On',
                            widget.request.createdAt?.toString() ?? 'N/A',
                          ),
                          if (widget.request.reason != null)
                            _buildDetailRow(
                              'Reason',
                              widget.request.reason!,
                              isMultiline: true,
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
            // Fixed action buttons
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  top: BorderSide(color: Colors.grey.shade200, width: 1),
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(12),
                  bottomRight: Radius.circular(12),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (!widget.isAdmin)
                    TextButton(
                      onPressed:
                          widget.onCancelled ??
                          () => Navigator.pop(context, 'CANCELLED'),
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.errorColor,
                      ),
                      child: const Text('CANCEL REQUEST'),
                    ),
                  if (!widget.isAdmin) const SizedBox(width: 15),
                  if (widget.isAdmin) ...[
                    TextButton(
                      onPressed: _isApproving || _isRejecting
                          ? null
                          : _handleReject,
                      style: TextButton.styleFrom(
                        foregroundColor: AppTheme.errorColor,
                      ),
                      child: _isRejecting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('REJECT'),
                    ),
                    const SizedBox(width: 15),
                    ElevatedButton(
                      onPressed: _isApproving || _isRejecting
                          ? null
                          : _handleApprove,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.successColor,
                        foregroundColor: Colors.white,
                      ),
                      child: _isApproving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Text('APPROVE'),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(
    BuildContext context, {
    required String title,
    required Widget child,
  }) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Card(
          color: AppTheme.backgroundColor,
          child: Padding(padding: const EdgeInsets.all(16), child: child),
        ),
      ],
    );
  }

  Widget _buildDetailRow(
    String label,
    String value, {
    Color? valueColor,
    bool isStatus = false,
    bool isMultiline = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: isStatus
                ? Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(value),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      value.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  )
                : Text(
                    value,
                    style: TextStyle(color: valueColor),
                    maxLines: isMultiline ? 2 : 1,
                    overflow: TextOverflow.ellipsis,
                  ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'pending':
        return Colors.orange;
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'cancelled':
        return Colors.grey;
      default:
        return Colors.blueGrey;
    }
  }
}
