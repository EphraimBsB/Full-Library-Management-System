// lib/src/features/loans/presentation/widgets/borrow_history_list.dart
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/student/presentation/providers/student_profile_providers.dart';

class BorrowHistoryList extends ConsumerWidget {
  final String userId;

  const BorrowHistoryList({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final borrowHistoryAsync = ref.watch(borrowHistoryProvider(userId));

    return borrowHistoryAsync.when(
      data: (response) {
        if (response.isEmpty) {
          return const Center(child: Text('No borrow history found'));
        }

        return GridView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 16),
          itemCount: response.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 1.7,
          ),
          itemBuilder: (context, index) {
            final item = response[index];
            return _BorrowHistoryCard(history: item);
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(child: Text('Error: ${error.toString()}')),
    );
  }
}

class _BorrowHistoryCard extends StatelessWidget {
  final Loan history;

  const _BorrowHistoryCard({required this.history});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final book = history.bookCopy!['book'];

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      color: AppTheme.surfaceColor,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            //satus chip
            Row(
              children: [
                Chip(
                  label: Text(
                    history.status.name.toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 11),
                  ),
                  backgroundColor: history.status == LoanStatus.active
                      ? Colors.green
                      : Colors.red,
                  shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.all(Radius.circular(16)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: CachedNetworkImage(
                    imageUrl: book['coverImageUrl'] ?? '',
                    width: 80,
                    height: 120,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(
                      width: 80,
                      height: 120,
                      color: Colors.grey[200],
                    ),
                    errorWidget: (_, __, ___) => Image.asset(
                      'assets/default_book.jpg',
                      width: 80,
                      height: 120,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),

                const SizedBox(width: 16),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        book['title'],
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        book['author'],
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        label: 'Book Copy',
                        value:
                            history.bookCopy?['accessNumber'].toString() ?? '',
                      ),
                      _InfoRow(
                        label: 'Borrowed',
                        value: _formatDate(history.borrowedAt),
                      ),
                      _InfoRow(
                        label: 'Due',
                        value: _formatDate(history.dueDate),
                        isOverdue:
                            history.dueDate.isBefore(DateTime.now()) &&
                            history.status != 'RETURNED',
                      ),

                      if (history.returnedAt != null)
                        _InfoRow(
                          label: 'Returned',
                          value: _formatDate(history.returnedAt!),
                        ),

                      if (history.fineAmount! > 0)
                        _InfoRow(
                          label: 'Fine',
                          value: '\$${history.fineAmount!.toStringAsFixed(2)}',
                          valueColor: Colors.red,
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isOverdue;
  final Color? valueColor;

  const _InfoRow({
    required this.label,
    required this.value,
    this.isOverdue = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            value,
            style: TextStyle(
              color: isOverdue ? Colors.red : valueColor,
              fontWeight: isOverdue ? FontWeight.bold : null,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
