import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/presentation/widgets/borrowing_tabs.dart';

void showBookDetailsDialog({
  required BuildContext context,
  required BookModel book,
}) {
  showDialog(
    context: context,
    builder: (context) => BookDetailsDialog(book: book),
  );
}

class BookDetailsDialog extends StatelessWidget {
  final BookModel book;
  final Function()? onBookDeleted;
  final Function(BookModel)? onBookUpdated;

  const BookDetailsDialog({
    super.key,
    required this.book,
    this.onBookDeleted,
    this.onBookUpdated,
  });

  Future<void> _handleDelete(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Book'),
        content: const Text(
          'Are you sure you want to delete this book? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: Theme.of(context).colorScheme.error,
            ),
            child: const Text('DELETE'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      // TODO: Implement actual delete API call
      await Future.delayed(const Duration(milliseconds: 500));

      if (context.mounted) {
        Navigator.of(context).pop(); // Close the details dialog
        onBookDeleted?.call();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Book deleted successfully')),
        );
      }
    }
  }

  Future<void> _handleEdit(BuildContext context) async {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Edit functionality not implemented yet')),
      );
    }
  }

  Future<void> _handleIssueBook(BuildContext context) async {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Issue book functionality not implemented yet'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;
    final screenHeight = MediaQuery.of(context).size.height;

    return Dialog(
      insetPadding: const EdgeInsets.all(25),
      backgroundColor: AppTheme.backgroundColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: 900,
          maxHeight: screenHeight * 0.9,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Fixed header
            Container(
              padding: const EdgeInsets.all(16.0),
              decoration: BoxDecoration(
                color: AppTheme.backgroundColor,
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Book Details',
                    style: textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Row(
                    children: [
                      // Issue Book button
                      OutlinedButton.icon(
                        onPressed: book.availableCopies > 0
                            ? () => _handleIssueBook(context)
                            : null,
                        icon: const Icon(Icons.check_circle_outline),
                        label: Text(
                          book.availableCopies > 0
                              ? 'Issue Book'
                              : 'No Copies Available',
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Edit button
                      OutlinedButton.icon(
                        onPressed: () => _handleEdit(context),
                        icon: const Icon(Icons.edit_outlined),
                        label: const Text('Edit'),
                      ),
                      const SizedBox(width: 8),
                      // Delete button
                      OutlinedButton.icon(
                        onPressed: () => _handleDelete(context),
                        icon: const Icon(Icons.delete_outline),
                        label: const Text('Delete'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Theme.of(context).colorScheme.error,
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Close button
                      IconButton(
                        icon: const Icon(Icons.close),
                        onPressed: () => Navigator.of(context).pop(),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Divider
            // const Divider(height: 1, thickness: 1),

            // Scrollable content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Book cover and basic info
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Book cover
                        if (book.coverImageUrl != null &&
                            book.coverImageUrl!.isNotEmpty)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: CachedNetworkImage(
                              imageUrl: book.coverImageUrl!,
                              width: 280,
                              height: 400,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                width: 280,
                                height: 400,
                                color: Colors.grey[200],
                                child: const Center(
                                  child: CircularProgressIndicator(),
                                ),
                              ),
                              errorWidget: (context, url, error) => Container(
                                width: 280,
                                height: 400,
                                color: Colors.grey[200],
                                child: Image.asset(
                                  'assets/default_book.jpg',
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                          )
                        else
                          Container(
                            width: 280,
                            height: 400,
                            color: Colors.grey[200],
                            child: Image.asset(
                              'assets/default_book.jpg',
                              fit: BoxFit.cover,
                            ),
                          ),

                        const SizedBox(width: 24),

                        // Book details
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Title
                              Text(
                                book.title,
                                style: textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 8),

                              // Author
                              Text(
                                'by ${book.author}',
                                style: textTheme.bodyMedium?.copyWith(
                                  color: Colors.grey[600],
                                ),
                              ),
                              const SizedBox(height: 8),

                              // Rating
                              if (book.rating > 0)
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.star,
                                      color: Colors.amber,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      book.rating.toStringAsFixed(1),
                                      style: textTheme.bodySmall?.copyWith(
                                        color: Colors.amber[800],
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '(${book.rating.toStringAsFixed(1)} out of 5.0)',
                                      style: textTheme.bodySmall?.copyWith(
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                              const SizedBox(height: 16),

                              // Basic info
                              _buildInfoRow('ISBN', book.isbn),
                              if (book.publisher != null)
                                _buildInfoRow('Publisher', book.publisher!),
                              _buildInfoRow(
                                'Published',
                                book.publicationYear.toString(),
                              ),
                              if (book.edition != null)
                                _buildInfoRow('Edition', book.edition!),
                              _buildInfoRow(
                                'Total Copies',
                                book.totalCopies.toString(),
                              ),
                              _buildInfoRow(
                                'Available',
                                book.availableCopies.toString(),
                              ),
                              _buildInfoRow('Type', book.type),

                              // Categories
                              if (book.categories.isNotEmpty) ...[
                                // const SizedBox(height: 16),
                                _buildInfoRow(
                                  'Categories',
                                  book.categories.map((c) => c.name).join(", "),
                                ),
                              ],

                              // Subjects
                              if (book.subjects.isNotEmpty) ...[
                                // const SizedBox(height: 8),
                                _buildInfoRow(
                                  'Subjects',
                                  book.subjects.map((s) => s.name).join(", "),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),

                    // Access Numbers
                    if (book.accessNumbers.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      Text(
                        'Access Numbers',
                        style: textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: book.accessNumbers
                            .map(
                              (accessNumber) => Chip(
                                label: Text(accessNumber.number),
                                backgroundColor: Colors.grey[200],
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                labelStyle: const TextStyle(fontSize: 12),
                              ),
                            )
                            .toList(),
                      ),
                    ],

                    // Description
                    if (book.description != null &&
                        book.description!.isNotEmpty) ...[
                      const SizedBox(height: 24),
                      Text(
                        'Description',
                        style: textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(book.description!, style: textTheme.bodySmall),
                    ],

                    // Library Book Borrowing Card
                    const SizedBox(height: 24),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.grey[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey[200]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Borrowing Status Section
                          Text(
                            'Borrowing Status',
                            style: textTheme.bodyMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Icon(
                                book.availableCopies > 0
                                    ? Icons.check_circle_outline
                                    : Icons.highlight_off_outlined,
                                color: book.availableCopies > 0
                                    ? Colors.green
                                    : Colors.red,
                                size: 20,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                book.availableCopies > 0
                                    ? '${book.availableCopies} ${book.availableCopies == 1 ? 'copy' : 'copies'} available for borrowing'
                                    : 'No copies currently available',
                                style: TextStyle(
                                  color: book.availableCopies > 0
                                      ? Colors.green[700]
                                      : Colors.red[700],
                                  fontWeight: FontWeight.w500,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Total copies: ${book.totalCopies} • Available: ${book.availableCopies} • On loan: ${book.totalCopies - book.availableCopies}',
                            style: textTheme.bodySmall?.copyWith(
                              color: Colors.grey[600],
                            ),
                          ),

                          // Tabbed Interface for Borrowing Details
                          const SizedBox(height: 16),
                          BorrowingTabs(
                            book: book,
                            onBorrowPressed: () => _handleIssueBook(context),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }
}
