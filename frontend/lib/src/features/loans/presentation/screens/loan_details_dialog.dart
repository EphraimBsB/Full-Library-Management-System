import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/loans/presentation/providers/loan_provider.dart';

class LoanDetailsDialog extends ConsumerStatefulWidget {
  final Loan loan;
  final Function(Loan)? onUpdate;
  final Function(String)? onDelete;
  final bool isAdmin;

  const LoanDetailsDialog({
    super.key,
    required this.loan,
    this.onUpdate,
    this.onDelete,
    this.isAdmin = true,
  });

  static Future<String?> show(
    BuildContext context, {
    required Loan loan,
    bool isAdmin = true,
    Function(Loan)? onUpdate,
    Function(String)? onDelete,
  }) async {
    return showDialog<String>(
      context: context,
      builder: (context) => LoanDetailsDialog(
        loan: loan,
        isAdmin: isAdmin,
        onUpdate: onUpdate,
        onDelete: onDelete,
      ),
    );
  }

  @override
  ConsumerState<LoanDetailsDialog> createState() => _LoanDetailsDialogState();
}

class _LoanDetailsDialogState extends ConsumerState<LoanDetailsDialog> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  bool _isReturning = false;
  bool _isRenewing = false;

  @override
  void initState() {
    super.initState();
    _notesController.text = widget.loan.notes ?? '';
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleReturn() async {
    setState(() => _isReturning = true);

    try {
      final result = await ref
          .read(loanRepositoryProvider)
          .returnBook(widget.loan.id);

      result.fold(
        (failure) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to return book: ${failure.message}'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        (returnedLoan) async {
          if (mounted) {
            ref.invalidate(allLoansProvider);
            ref.invalidate(userLoansProvider);
            if (widget.onUpdate != null) {
              await widget.onUpdate!(returnedLoan);
            }
            if (mounted) {
              Navigator.of(context).pop('RETURNED');
            }
          }
        },
      );
    } catch (e) {
      if (mounted) {
        debugPrint('Error returning book: $e');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('An unexpected error occurred: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isReturning = false);
      }
    }
  }

  Future<void> _handleRenew() async {
    setState(() => _isRenewing = true);

    try {
      final result = await ref
          .read(loanRepositoryProvider)
          .renewLoan(widget.loan.id);

      result.fold(
        (failure) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Failed to renew book: ${failure.message}'),
                backgroundColor: Colors.red,
              ),
            );
          }
        },
        (returnedLoan) async {
          if (mounted) {
            ref.invalidate(allLoansProvider);
            ref.invalidate(userLoansProvider);
            if (widget.onUpdate != null) {
              await widget.onUpdate!(returnedLoan);
            }
            if (mounted) {
              Navigator.of(context).pop('RENEWED');
            }
          }
        },
      );
    } catch (e) {
      if (mounted) {
        debugPrint('Error renewing book: $e');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('An unexpected error occurred: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isRenewing = false);
      }
    }
  }

  Future<void> _showReturnConfirmation() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Return'),
        content: const Text(
          'Are you sure you want to mark this book as returned?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('CANCEL'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).primaryColor,
              foregroundColor: Colors.white,
            ),
            child: const Text('CONFIRM RETURN'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _handleReturn();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isReturned = widget.loan.status == LoanStatus.returned;
    final isOverdue =
        !isReturned && widget.loan.dueDate.isBefore(DateTime.now());
    final daysDifference = widget.loan.dueDate
        .difference(DateTime.now())
        .inDays
        .abs();
    final statusColor = _getStatusColor(widget.loan.status);

    return Dialog(
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.6,
          maxHeight: MediaQuery.of(context).size.height * 0.9,
        ),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Padding(
                    padding: const EdgeInsets.only(left: 20.0, top: 16.0),
                    child: Text(
                      'Loan Details',
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

              // Content
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Book Information Section
                      _buildSection(
                        context,
                        title: 'Book Information',
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Book Cover
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: CachedNetworkImage(
                                imageUrl:
                                    widget
                                        .loan
                                        .bookCopy?['book']?['coverImageUrl'] ??
                                    'assets/default_book.jpg',
                                height: 200,
                                width: 140,
                                fit: BoxFit.cover,
                                errorWidget: (context, url, error) =>
                                    Image.asset('assets/default_book.jpg'),
                                placeholder: (context, url) =>
                                    const CircularProgressIndicator(),
                              ),
                            ),

                            const SizedBox(width: 16),

                            // Book Details
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildDetailRow(
                                    'Title',
                                    widget.loan.bookCopy?['book']?['title'] ??
                                        'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Author',
                                    widget.loan.bookCopy?['book']?['author'] ??
                                        'N/A',
                                  ),
                                  _buildDetailRow(
                                    'ISBN',
                                    widget.loan.bookCopy?['book']?['isbn'] ??
                                        'N/A',
                                  ),
                                  _buildDetailRow(
                                    'DDC',
                                    widget.loan.bookCopy?['book']?['ddc'] ??
                                        'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Publisher',
                                    widget
                                            .loan
                                            .bookCopy?['book']?['publisher'] ??
                                        'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Access Number',
                                    widget.loan.bookCopy?['accessNumber'] ??
                                        'N/A',
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Borrower Information Section
                      _buildSection(
                        context,
                        title: 'Borrower Information',
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // User Avatar
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: CachedNetworkImage(
                                imageUrl:
                                    widget.loan.user?['profileImageUrl'] ??
                                    'assets/default_avatar.png',
                                height: 120,
                                width: 120,
                                fit: BoxFit.cover,
                                errorWidget: (context, url, error) =>
                                    Image.asset('assets/default_avatar.png'),
                                placeholder: (context, url) =>
                                    const CircularProgressIndicator(),
                              ),
                            ),

                            const SizedBox(width: 16),

                            // User Details
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildDetailRow(
                                    'Name',
                                    '${widget.loan.user?['firstName'] ?? ''} ${widget.loan.user?['lastName'] ?? ''}'
                                        .trim(),
                                  ),
                                  _buildDetailRow(
                                    'Roll Number',
                                    widget.loan.user?['rollNumber'] ?? 'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Email',
                                    widget.loan.user?['email'] ?? 'N/A',
                                  ),
                                  _buildDetailRow(
                                    'Phone',
                                    widget.loan.user?['phoneNumber'] ?? 'N/A',
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Loan Information Section
                      _buildSection(
                        context,
                        title: 'Loan Information',
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildDetailRow(
                              'Status',
                              widget.loan.status
                                  .toString()
                                  .split('.')
                                  .last
                                  .toUpperCase(),
                              isStatus: true,
                            ),
                            _buildDetailRow(
                              'Borrowed On',
                              _formatDate(widget.loan.borrowedAt),
                            ),
                            _buildDetailRow(
                              'Due Date',
                              _formatDate(widget.loan.dueDate),
                              valueColor: isOverdue ? Colors.red : null,
                            ),
                            if (isReturned)
                              _buildDetailRow(
                                'Returned On',
                                _formatDate(widget.loan.returnedAt),
                              ),
                            if (widget.loan.fineAmount != null &&
                                widget.loan.fineAmount! > 0)
                              _buildDetailRow(
                                'Fine Amount',
                                'UGX ${widget.loan.fineAmount?.toStringAsFixed(2)}',
                                valueColor: Colors.orange,
                              ),
                            if (!isReturned && isOverdue)
                              _buildDetailRow(
                                'Overdue By',
                                '$daysDifference days',
                                valueColor: Colors.red,
                              ),
                            if (!isReturned && !isOverdue)
                              _buildDetailRow(
                                'Due In',
                                '$daysDifference days',
                                valueColor: Colors.green,
                              ),
                          ],
                        ),
                      ),

                      // Notes Section
                      if (widget.loan.notes?.isNotEmpty == true ||
                          !isReturned) ...[
                        const SizedBox(height: 16),
                        _buildSection(
                          context,
                          title: 'Notes',
                          child: TextFormField(
                            controller: _notesController,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              hintText: 'Add any notes about this loan...',
                              border: OutlineInputBorder(),
                              contentPadding: EdgeInsets.all(12),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Footer with action buttons
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(
                    top: BorderSide(color: Colors.grey.shade200, width: 1),
                  ),
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(12),
                    bottomRight: Radius.circular(12),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    // Close button
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('CLOSE'),
                    ),

                    // Return button (show only for borrowed/overdue loans)
                    if (!isReturned && widget.isAdmin) ...[
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _isReturning
                            ? null
                            : _showReturnConfirmation,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          foregroundColor: Colors.white,
                        ),
                        child: _isReturning
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('RETURN BOOK'),
                      ),
                    ],

                    // Renew button (show only for borrowed, non-overdue loans)
                    if (!isReturned && !isOverdue && widget.isAdmin) ...[
                      const SizedBox(width: 8),
                      OutlinedButton(
                        onPressed: _isRenewing ? null : _handleRenew,
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(
                            color: Theme.of(context).primaryColor,
                          ),
                        ),
                        child: _isRenewing
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.blue,
                                ),
                              )
                            : const Text('RENEW LOAN'),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
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
            width: 120,
            child: Text(
              label,
              style: const TextStyle(
                fontWeight: FontWeight.w500,
                color: Colors.grey,
              ),
            ),
          ),
          const SizedBox(width: 8),
          isStatus
              ? Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(widget.loan.status),
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
              : Expanded(
                  child: Text(
                    value,
                    style: TextStyle(color: valueColor ?? Colors.black87),
                    maxLines: isMultiline ? 2 : 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
        ],
      ),
    );
  }

  Color _getStatusColor(LoanStatus status) {
    switch (status) {
      case LoanStatus.borrowed:
        return Colors.blue;
      case LoanStatus.returned:
        return Colors.green;
      case LoanStatus.overdue:
        return Colors.red;
      case LoanStatus.lost:
        return Colors.purple;
      case LoanStatus.damaged:
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return DateFormat('MMM d, y hh:mm a').format(date);
  }
}
