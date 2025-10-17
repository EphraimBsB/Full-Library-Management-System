import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:management_side/src/features/books/domain/models/book_copy.dart';
import 'package:management_side/src/features/books/domain/models/book_details.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/models/borrow_history.dart';
import 'package:management_side/src/features/books/domain/models/current_borrow.dart';
import 'package:management_side/src/features/books/domain/models/queue_request.dart';
import 'package:management_side/src/features/books/presentation/providers/book_details_provider.dart';
import 'package:management_side/src/core/widgets/error_view.dart';
import 'package:management_side/src/core/widgets/loading_view.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/books/presentation/screens/book_form_dialog.dart';
import 'package:management_side/src/features/books/presentation/screens/ebook_reader_screen.dart';

/// Shows a dialog with book details
Future<void> showBookDetailsDialog({
  required BuildContext context,
  required int bookId,
  VoidCallback? onBookDeleted,
  Function(Book)? onBookUpdated,
}) {
  return showDialog(
    context: context,
    builder: (context) => BookDetailsDialog(
      bookId: bookId,
      onBookDeleted: onBookDeleted,
      onBookUpdated: onBookUpdated,
    ),
  );
}

class BookDetailsDialog extends ConsumerWidget {
  final int bookId;
  final VoidCallback? onBookDeleted;
  final Function(Book)? onBookUpdated;

  const BookDetailsDialog({
    super.key,
    required this.bookId,
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

  Future<void> _handleEdit(
    BuildContext context,
    WidgetRef ref,
    BookModel book,
  ) async {
    try {
      final updatedBook = showBookFormDialog(context: context, book: book);

      if (context.mounted) {
        // Invalidate the cache to force a refresh
        ref.invalidate(bookDetailsProvider(bookId));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating book: ${e.toString()}')),
        );
      }
    }
  }

  void _handleIssueBook(BuildContext context) {
    // TODO: Implement issue book functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Issue book functionality not implemented yet'),
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

  Widget _buildBookInfoRow(BuildContext context, BookModel book) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Book cover
        if (book.coverImageUrl != null && book.coverImageUrl!.isNotEmpty)
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
                child: const Center(child: CircularProgressIndicator()),
              ),
              errorWidget: (context, url, error) => Image.asset(
                'assets/default_book.jpg',
                width: 280,
                height: 400,
                fit: BoxFit.cover,
              ),
            ),
          )
        else
          Container(
            width: 280,
            height: 400,
            color: Colors.grey[200],
            child: const Icon(Icons.book, size: 40, color: Colors.grey),
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
                style: textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
              ),
              const SizedBox(height: 8),

              // Rating
              if (book.rating != null && book.rating! > 0)
                Row(
                  children: [
                    const Icon(Icons.star, color: Colors.amber, size: 20),
                    const SizedBox(width: 4),
                    Text(
                      book.rating!.toStringAsFixed(1),
                      style: textTheme.bodySmall?.copyWith(
                        color: Colors.amber[800],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '(${book.rating!.toStringAsFixed(1)} out of 5.0)',
                      style: textTheme.bodySmall?.copyWith(
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              const SizedBox(height: 16),

              // Basic info
              _buildInfoRow('ISBN', book.isbn!),
              if (book.publisher != null)
                _buildInfoRow('Publisher', book.publisher!),
              _buildInfoRow('Published', book.publicationYear.toString()),
              if (book.edition != null) _buildInfoRow('Edition', book.edition!),
              _buildInfoRow('Total Copies', book.totalCopies.toString()),
              _buildInfoRow('Available', book.availableCopies.toString()),
              _buildInfoRow('Type', book.type!.name),

              // Categories
              if (book.categories != null && book.categories!.isNotEmpty) ...[
                _buildInfoRow(
                  'Categories',
                  book.categories!.map((c) => c.name).join(", "),
                ),
              ],

              // Subjects
              if (book.subjects != null && book.subjects!.isNotEmpty) ...[
                _buildInfoRow(
                  'Subjects',
                  book.subjects!.map((s) => s.name).join(", "),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBorrowingStatusCard(
    BuildContext context,
    BookModel book,
    BookDetails bookDetails,
  ) {
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(top: 24),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status summary
          Text(
            'Borrowing Status',
            style: textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(
                book.availableCopies! > 0
                    ? Icons.check_circle_outline
                    : Icons.highlight_off_outlined,
                color: book.availableCopies! > 0 ? Colors.green : Colors.red,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                book.availableCopies! > 0
                    ? '${book.availableCopies} ${book.availableCopies == 1 ? 'copy' : 'copies'} available for borrowing'
                    : 'No copies currently available',
                style: TextStyle(
                  color: book.availableCopies! > 0
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
            'Total copies: ${book.totalCopies} • Available: ${book.availableCopies!} • On loan: ${book.totalCopies - book.availableCopies!}',
            style: textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
          ),

          // Tabs
          const SizedBox(height: 16),
          DefaultTabController(
            length: 4, // Number of tabs
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TabBar(
                  isScrollable: false,
                  labelColor: theme.primaryColor,
                  unselectedLabelColor: Colors.grey[600],
                  indicatorColor: theme.primaryColor,
                  labelStyle: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  tabs: const [
                    Tab(text: 'Book Copies'),
                    Tab(text: 'Currently Borrowed By'),
                    Tab(text: 'Borrow History'),
                    Tab(text: 'Requests Queue'),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 200, // Fixed height for the tab content
                  child: TabBarView(
                    children: [
                      // Book Copies Tab
                      bookDetails.book.copies!.isNotEmpty
                          ? _buildBookCopiesList(bookDetails.book.copies!)
                          : _buildEmptyState('No copies available', Icons.book),

                      // Currently Borrowed By Tab
                      bookDetails.currentBorrows.isNotEmpty
                          ? _buildBorrowedByList(bookDetails.currentBorrows)
                          : _buildEmptyState(
                              'No active borrows',
                              Icons.hourglass_empty,
                            ),

                      // Borrow History Tab
                      bookDetails.borrowHistory.isNotEmpty
                          ? _buildBorrowHistoryList(bookDetails.borrowHistory)
                          : _buildEmptyState(
                              'No borrow history',
                              Icons.history,
                            ),

                      // Queue Requests Tab
                      bookDetails.queueRequests.isNotEmpty
                          ? _buildQueueRequestsList(bookDetails.queueRequests)
                          : _buildEmptyState(
                              'No queue requests',
                              Icons.people_outline,
                            ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBorrowedByList(List<CurrentBorrow> borrows) {
    return ListView.builder(
      itemCount: borrows.length,
      itemBuilder: (context, index) {
        final borrow = borrows[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(color: Colors.grey[200]!),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            leading: CircleAvatar(
              backgroundColor: Colors.blue[50],
              child: Icon(Icons.person_outline, color: Colors.blue[700]),
            ),
            title: Text(
              borrow.borrower.name,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Due: ${borrow.dueDate}'),
                if (borrow.isOverdue)
                  const Text(
                    'Overdue',
                    style: TextStyle(
                      color: Colors.red,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
              ],
            ),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
          ),
        );
      },
    );
  }

  Widget _buildBorrowHistoryList(List<BorrowHistory> history) {
    return ListView.builder(
      itemCount: history.length,
      itemBuilder: (context, index) {
        final item = history[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(color: Colors.grey[200]!),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            leading: CircleAvatar(
              backgroundColor: Colors.green[50],
              child: Icon(Icons.check_circle_outline, color: Colors.green[700]),
            ),
            title: Text(
              item.borrower.name,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Borrowed: ${item.borrowedAt}'),
                Text('Returned: ${item.returnedAt}'),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildQueueRequestsList(List<QueueRequest> requests) {
    return ListView.builder(
      itemCount: requests.length,
      itemBuilder: (context, index) {
        final request = requests[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(color: Colors.grey[200]!),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 8,
            ),
            leading: CircleAvatar(
              backgroundColor: Colors.orange[50],
              child: Text(
                '${index + 1}',
                style: TextStyle(
                  color: Colors.orange[700],
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            title: Text(
              request.name,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
            subtitle: Text('Requested on: ${request.requestedAt}'),
            trailing: const Icon(Icons.chevron_right, color: Colors.grey),
          ),
        );
      },
    );
  }

  Widget _buildBookCopiesList(List<BookCopy> copies) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 6, // Number of items per row
        crossAxisSpacing: 12, // Spacing between columns
        mainAxisSpacing: 12, // Spacing between rows
        childAspectRatio: 1.5, // Width / height ratio
      ),
      itemCount: copies.length,
      itemBuilder: (context, index) {
        final copy = copies[index];
        final isAvailable = copy.status == 'AVAILABLE';

        return Card(
          elevation: 0,
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(
              color: isAvailable ? Colors.green[100]! : Colors.grey[200]!,
              width: 1,
            ),
          ),
          child: InkWell(
            onTap: () {
              // Handle copy tap if needed
            },
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    children: [
                      Icon(
                        isAvailable
                            ? Icons.check_circle_outline
                            : Icons.lock_outline,
                        size: 16,
                        color: isAvailable ? Colors.green : Colors.grey,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'Copy #${copy.accessNumber}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isAvailable ? Colors.green[50] : Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _formatStatus(copy.status),
                      style: TextStyle(
                        color: isAvailable
                            ? Colors.green[700]
                            : Colors.grey[700],
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  // Add more details if needed
                  // if (copy.location != null) ...[
                  //   const SizedBox(height: 8),
                  //   Text(
                  //     'Shelf: ${copy.location}',
                  //     style: const TextStyle(
                  //       fontSize: 11,
                  //       color: Colors.grey,
                  //     ),
                  //     maxLines: 1,
                  //     overflow: TextOverflow.ellipsis,
                  //   ),
                  // ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  String _formatStatus(String status) {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'BORROWED':
        return 'Borrowed';
      case 'LOST':
        return 'Lost';
      case 'DAMAGED':
        return 'Damaged';
      case 'IN_REPAIR':
        return 'In Repair';
      default:
        return status;
    }
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 48, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(message, style: TextStyle(color: Colors.grey[600])),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, WidgetRef ref, BookModel book) {
    final bool canReadEbook =
        book.ebookUrl != null && book.ebookUrl!.isNotEmpty;

    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: AppTheme.backgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
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
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          Row(
            children: [
              // Read E-book button (only show for non-physical books with ebookUrl)
              if (canReadEbook &&
                  book.ebookUrl != null &&
                  book.ebookUrl!.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(right: 8.0),
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (context) => EbookReaderScreen(
                            bookTitle: book.title,
                            ebookUrl: book.ebookUrl!,
                          ),
                        ),
                      );
                    },
                    icon: const Icon(Icons.menu_book_outlined),
                    label: const Text('Read E-book'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).primaryColor,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),

              // Issue Book button (only for physical books)
              // if (book.type.name.toLowerCase() == 'physical')
              OutlinedButton.icon(
                onPressed: book.availableCopies! > 0
                    ? () => _handleIssueBook(context)
                    : null,
                icon: const Icon(Icons.check_circle_outline),
                label: Text(
                  book.availableCopies! > 0
                      ? 'Issue Book'
                      : 'No Copies Available',
                ),
              ),
              const SizedBox(width: 8),
              // Edit button
              OutlinedButton.icon(
                onPressed: () => _handleEdit(context, ref, book),
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
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookDetailsAsync = ref.watch(bookDetailsProvider(bookId));
    final theme = Theme.of(context);
    final textTheme = theme.textTheme;

    print(
      "Book Image cover Url: ${bookDetailsAsync.value?.book.coverImageUrl}",
    );
    print("Book Ebook Url: ${bookDetailsAsync.value?.book.ebookUrl}");

    return bookDetailsAsync.when(
      loading: () =>
          const Center(child: LoadingView(message: 'Loading book details...')),
      error: (error, stack) => ErrorView(
        error: error.toString(),
        onRetry: () => ref.refresh(bookDetailsProvider(bookId)),
      ),
      data: (bookDetails) {
        final book = bookDetails.book;
        return Dialog(
          insetPadding: const EdgeInsets.all(25),
          backgroundColor: AppTheme.backgroundColor,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: 1000,
              maxHeight: MediaQuery.of(context).size.height * 0.9,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header with actions
                _buildHeader(context, ref, book),

                // Main content
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Book info row (cover + details)
                        _buildBookInfoRow(context, book),

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

                        // Borrowing status card
                        _buildBorrowingStatusCard(context, book, bookDetails),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// Helper extension for string capitalization
extension StringExtension on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1).toLowerCase()}';
  }
}
