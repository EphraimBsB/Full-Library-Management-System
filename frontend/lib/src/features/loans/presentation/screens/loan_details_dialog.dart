import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';

class LoanDetailsDialog extends StatefulWidget {
  final Loan loan;
  final Function(Loan) onUpdate;
  final Function(String) onDelete;

  const LoanDetailsDialog({
    super.key,
    required this.loan,
    required this.onUpdate,
    required this.onDelete,
  });

  @override
  State<LoanDetailsDialog> createState() => _LoanDetailsDialogState();
}

class _LoanDetailsDialogState extends State<LoanDetailsDialog> {
  final _formKey = GlobalKey<FormState>();
  late LoanStatus _status;
  double? _fineAmount;
  final _notesController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _status = widget.loan.status;
    _fineAmount = widget.loan.fineAmount;
    _notesController.text = widget.loan.notes ?? '';
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleReturn() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final updatedLoan = widget.loan.copyWith(
        status: LoanStatus.returned,
        returnedDate: DateTime.now(),
        fineAmount: _fineAmount,
        notes: _notesController.text,
        updatedAt: DateTime.now(),
      );

      await widget.onUpdate(updatedLoan);
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to update loan: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleUpdateStatus() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final updatedLoan = widget.loan.copyWith(
        status: _status,
        fineAmount: _fineAmount,
        notes: _notesController.text,
        updatedAt: DateTime.now(),
      );

      await widget.onUpdate(updatedLoan);
      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Failed to update loan: $e')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Color _getStatusColor(LoanStatus status) {
    switch (status) {
      case LoanStatus.borrowed:
        return Colors.blue;
      case LoanStatus.returned:
        return Colors.green;
      case LoanStatus.overdue:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildDetailItem(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            const SizedBox(height: 2),
            SizedBox(
              width: 200,
              child: Text(
                value,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDateInfo(
    String label,
    String date,
    IconData icon, {
    bool isWarning = false,
    bool isSuccess = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(
            icon,
            size: 16,
            color: isWarning
                ? Colors.red
                : isSuccess
                ? Colors.green
                : Colors.grey[600],
          ),
          const SizedBox(width: 8),
          Text(
            '$label: ',
            style: TextStyle(color: Colors.grey[600], fontSize: 14),
          ),
          Text(
            date,
            style: TextStyle(
              fontWeight: FontWeight.w500,
              color: isWarning
                  ? Colors.red
                  : isSuccess
                  ? Colors.green
                  : Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isReturned = _status == LoanStatus.returned;
    final isOverdue =
        !isReturned && widget.loan.dueDate.isBefore(DateTime.now());
    final daysDifference = widget.loan.dueDate
        .difference(DateTime.now())
        .inDays
        .abs();
    final statusColor = _getStatusColor(_status);

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      backgroundColor: AppTheme.backgroundColor,
      content: Container(
        width: MediaQuery.of(context).size.width * 0.5,
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header with status and close button
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _status.toString().split('.').last.toUpperCase(),
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    const Spacer(),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Main content
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Book cover
                    Container(
                      width: 160,
                      height: 240,
                      decoration: BoxDecoration(
                        color: Colors.grey[200],
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.1),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child:
                            widget.loan.book.coverImageUrl?.isNotEmpty == true
                            ? CachedNetworkImage(
                                imageUrl: widget.loan.book.coverImageUrl!,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => Center(
                                  child: CircularProgressIndicator(
                                    strokeWidth: 1.5,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.grey[400]!,
                                    ),
                                  ),
                                ),
                                errorWidget: (context, url, error) =>
                                    const Icon(
                                      Icons.broken_image,
                                      size: 40,
                                      color: Colors.grey,
                                    ),
                              )
                            : const Center(
                                child: Icon(
                                  Icons.menu_book,
                                  size: 48,
                                  color: Colors.grey,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(width: 24),

                    // Book and loan details
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Book title and author
                          Text(
                            widget.loan.book.title,
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'by ${widget.loan.book.author.isNotEmpty ? widget.loan.book.author : 'Unknown Author'}\n',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),

                          // Book details grid
                          GridView.count(
                            shrinkWrap: true,
                            crossAxisCount: 2,
                            crossAxisSpacing: 16,
                            childAspectRatio: 4,
                            children: [
                              _buildDetailItem(
                                Icons.confirmation_number,
                                'Access Number',
                                widget.loan.accessNumber,
                              ),
                              _buildDetailItem(
                                Icons.numbers,
                                'DDC',
                                widget.loan.book.ddc ?? 'N/A',
                              ),
                              _buildDetailItem(
                                Icons.library_books,
                                'ISBN',
                                widget.loan.book.isbn,
                              ),
                              _buildDetailItem(
                                Icons.category,
                                'Categories',
                                widget.loan.book.categories.isNotEmpty
                                    ? widget.loan.book.categories.join(', ')
                                    : 'N/A',
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    //Borrower info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Borrower info
                          const SizedBox(height: 16),
                          const Text(
                            'Borrower Information',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 8),
                          ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              radius: 20,
                              backgroundColor: theme.primaryColor.withOpacity(
                                0.1,
                              ),
                              child: const Icon(
                                Icons.person,
                                color: Colors.blue,
                              ),
                            ),
                            title: Text(
                              widget.loan.user.fullName,
                              style: const TextStyle(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Roll: ${widget.loan.user.rollNumber}'),
                                Text('Email: ${widget.loan.user.email}'),
                                // Text('Phone: ${widget.loan.user.phoneNumber}'),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    //Loan info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Loan dates
                          const SizedBox(height: 16),
                          const Text(
                            'Loan Information',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 8),
                          _buildDateInfo(
                            'Borrowed',
                            _formatDate(widget.loan.borrowedDate),
                            Icons.calendar_today,
                          ),
                          _buildDateInfo(
                            'Due Date',
                            _formatDate(widget.loan.dueDate),
                            Icons.event_busy,
                            isWarning: isOverdue,
                          ),
                          if (isReturned)
                            _buildDateInfo(
                              'Returned',
                              _formatDate(widget.loan.returnedDate!),
                              Icons.check_circle,
                              isSuccess: true,
                            ),

                          // Days remaining/overdue
                          if (!isReturned) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: isOverdue
                                    ? Colors.red[50]
                                    : Colors.green[50],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: isOverdue
                                      ? Colors.red[100]!
                                      : Colors.green[100]!,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    isOverdue
                                        ? Icons.warning_amber_rounded
                                        : Icons.timer,
                                    color: isOverdue
                                        ? Colors.red
                                        : Colors.green,
                                    size: 18,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    isOverdue
                                        ? '$daysDifference days overdue'
                                        : 'Due in $daysDifference days',
                                    style: TextStyle(
                                      color: isOverdue
                                          ? Colors.red
                                          : Colors.green,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          // Fine amount
                          const SizedBox(height: 16),
                          if (widget.loan.fineAmount != null &&
                              widget.loan.fineAmount! > 0)
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.orange[50],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.orange[100]!),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Fine Amount',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.orange,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  TextFormField(
                                    initialValue:
                                        _fineAmount?.toStringAsFixed(2) ??
                                        widget.loan.fineAmount?.toStringAsFixed(
                                          2,
                                        ) ??
                                        '0.00',
                                    keyboardType: TextInputType.number,
                                    decoration: InputDecoration(
                                      prefixText: 'UGX ',
                                      border: const OutlineInputBorder(),
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                            horizontal: 12,
                                            vertical: 8,
                                          ),
                                      suffixText: 'UGX',
                                      suffixStyle: const TextStyle(
                                        color: Colors.orange,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    onChanged: (value) {
                                      _fineAmount = double.tryParse(value);
                                    },
                                  ),
                                ],
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),

                // Notes
                const SizedBox(height: 16),
                const Text(
                  'Notes',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _notesController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Add any notes about this loan...',
                    border: const OutlineInputBorder(),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
          child: const Text('Close'),
        ),
        if (!isReturned) ...[
          const SizedBox(width: 8),
          ElevatedButton(
            onPressed: _isLoading
                ? null
                : () {
                    if (_status == LoanStatus.returned) {
                      _handleReturn();
                    } else {
                      _handleUpdateStatus();
                    }
                  },
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text('Mark as Returned'),
          ),
        ],
      ],
    );
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return DateFormat('MMM d, y hh:mm a').format(date);
  }
}
