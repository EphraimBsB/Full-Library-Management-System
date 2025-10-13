import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/loans/presentation/screens/loan_details_dialog.dart';

Widget buildLoanCard(BuildContext context, Loan loan) {
  final isOverdue =
      loan.dueDate.isBefore(DateTime.now()) &&
      loan.status != LoanStatus.returned;
  final statusColor = _getStatusColor(loan.status);
  final daysDifference = loan.dueDate.difference(DateTime.now()).inDays.abs();

  // Safely access nested book properties
  final bookTitle = loan.bookData?['title']?.toString() ?? 'Unknown Book';
  final bookAuthor = loan.bookData?['author']?.toString() ?? 'Unknown Author';
  final bookCoverUrl =
      loan.bookData?['coverImageUrl']?.toString() ??
      loan.bookData?['book']?['coverImageUrl']?.toString() ??
      '';
  final hasCoverImage = bookCoverUrl.isNotEmpty;
  final ddc = loan.bookData?['ddc']?.toString() ?? 'N/A';

  // Safely access user properties
  final user = loan.user ?? {};
  final firstName = user['firstName']?.toString() ?? '';
  final lastName = user['lastName']?.toString() ?? '';
  final rollNumber = user['rollNumber']?.toString() ?? 'N/A';

  return Card(
    elevation: 2,
    color: AppTheme.backgroundColor,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    child: InkWell(
      onTap: () {
        showDialog(
          context: context,
          builder: (context) => LoanDetailsDialog(
            loan: loan,
            onUpdate: (loan) {},
            onDelete: (id) {},
          ),
        );
      },
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status and loan ID
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Status badge
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    loan.status.toString().split('.').last.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                // Loan ID
                Text(
                  'Loan #${loan.id.split('-').first}',
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey[600],
                    fontFamily: 'RobotoMono',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Book and borrower info row
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Book cover with cached network image
                Container(
                  width: 80,
                  height: 120,
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
                  child: hasCoverImage
                      ? CachedNetworkImage(
                          imageUrl: bookCoverUrl,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                          placeholder: (context, url) => const Center(
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          errorWidget: (context, url, error) =>
                              const Icon(Icons.book),
                        )
                      : const Center(
                          child: Icon(
                            Icons.menu_book_rounded,
                            size: 40,
                            color: Colors.grey,
                          ),
                        ),
                ),
                const SizedBox(width: 12),

                // Book and user details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Book title
                      Text(
                        bookTitle,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),

                      // Book author
                      Text(
                        bookAuthor,
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),

                      // DDC number
                      Row(
                        children: [
                          const Icon(
                            Icons.numbers,
                            size: 14,
                            color: Colors.grey,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'DDC: $ddc',
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey[700],
                              fontFamily: 'RobotoMono',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Access number
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.blue[50],
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.blue[100]!),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.qr_code,
                              size: 12,
                              color: Colors.blue,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Copy: ${loan.bookCopy!["accessNumber"]}',
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.blue[800],
                                fontWeight: FontWeight.w500,
                                fontFamily: 'RobotoMono',
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Borrower info
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 12,
                            backgroundColor: Colors.grey[200],
                            child: const Icon(
                              Icons.person_outline,
                              size: 12,
                              color: Colors.grey,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '$firstName $lastName'.trim().isNotEmpty
                                      ? '$firstName $lastName'.trim()
                                      : 'Unknown User',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  'Roll: $rollNumber',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey[600],
                                    fontFamily: 'RobotoMono',
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),
            // Divider
            Divider(height: 1, color: Colors.grey[200]),
            const SizedBox(height: 8),

            // Dates and action row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Due date
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Due Date',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _formatDate(loan.dueDate),
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isOverdue ? Colors.red : null,
                      ),
                    ),
                  ],
                ),

                // Days remaining/overdue
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: isOverdue ? Colors.red[50] : Colors.green[50],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    loan.status == LoanStatus.returned &&
                            loan.returnedAt != null
                        ? 'Returned on ${_formatDate(loan.returnedAt!)}'
                        : isOverdue
                        ? '$daysDifference days overdue'
                        : 'Due in $daysDifference days',
                    style: TextStyle(
                      fontSize: 10,
                      color: isOverdue ? Colors.red[800] : Colors.green[800],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),

            // Fine amount if any
            if (loan.fineAmount != null && loan.fineAmount! > 0) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.orange[50],
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: Colors.orange[100]!),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.money_off, size: 12, color: Colors.orange),
                    const SizedBox(width: 4),
                    Text(
                      'Fine: UGX ${loan.fineAmount!.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Colors.orange,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    ),
  );
}

// Format date using intl package
String _formatDate(DateTime date) {
  return DateFormat('MMM d, y').format(date);
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
