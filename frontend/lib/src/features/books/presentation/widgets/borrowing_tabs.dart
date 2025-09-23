import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/models/borrowed_book.dart';
import 'package:management_side/src/features/books/domain/repositories/borrowing_repository.dart';
import 'package:management_side/src/features/books/data/repositories/borrowing_repository_impl.dart';
import 'package:management_side/src/core/utils/error_handler.dart';

class BorrowingTabs extends StatefulWidget {
  final BookModel book;
  final Function() onBorrowPressed;

  const BorrowingTabs({
    super.key,
    required this.book,
    required this.onBorrowPressed,
  });

  @override
  State<BorrowingTabs> createState() => _BorrowingTabsState();
}

class _BorrowingTabsState extends State<BorrowingTabs>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final DateFormat _dateFormat = DateFormat('MMM d, y');
  // final DateFormat _timeFormat = DateFormat('h:mm a');

  // State for borrowed books
  List<BorrowedBook> _borrowedBooks = [];
  List<BorrowedBook> _borrowingHistory = [];
  List<BorrowedBook> _pendingRequests = [];
  bool _isLoading = true;
  String? _errorMessage;

  // Repository for fetching data
  final BorrowingRepository _borrowingRepository = BorrowingRepositoryImpl();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final bookId = widget.book.id.toString();

      // Load current borrowings for this book
      final currentBorrowings = await _borrowingRepository
          .getBookBorrowingStatus(bookId: bookId, limit: 100);

      // Load borrowing history for this book
      final historyResult = await _borrowingRepository.getBookBorrowingHistory(
        bookId: bookId,
        limit: 100,
      );

      // Load pending requests for this book
      final queueResult = await _borrowingRepository.getBookRequestQueue(
        bookId: bookId,
      );

      if (!mounted) return;

      // Process current borrowings
      currentBorrowings.when(
        success: (response) {
          if (!mounted) return;
          setState(() {
            _borrowedBooks = response.items;
          });
        },
        failure: (error, stackTrace) {
          if (!mounted) return;
          setState(() {
            _errorMessage = ErrorHandler.getErrorMessage(error);
          });
        },
      );

      // Process history
      historyResult.when(
        success: (response) {
          if (!mounted) return;
          setState(() {
            _borrowingHistory = response.items;
          });
        },
        failure: (error, stackTrace) {
          if (!mounted) return;
          setState(() {
            _errorMessage = ErrorHandler.getErrorMessage(error);
          });
        },
      );

      // Process queue
      queueResult.when(
        success: (queue) {
          if (!mounted) return;
          setState(() {
            _pendingRequests = queue;
          });
        },
        failure: (error, stackTrace) {
          if (!mounted) return;
          // If queue fails, fall back to filtering from history as a fallback
          setState(() {
            _pendingRequests = _borrowingHistory
                .where((book) => book.status == BorrowedBookStatus.requested)
                .toList();
            _errorMessage =
                'Failed to load queue: ${ErrorHandler.getErrorMessage(error)}';
          });
        },
      );

      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Failed to load data: ${e.toString()}';
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TabBar(
          controller: _tabController,
          isScrollable: false,
          labelColor: Theme.of(context).primaryColor,
          unselectedLabelColor: Colors.grey[600],
          indicatorColor: Theme.of(context).primaryColor,
          labelStyle: textTheme.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
          unselectedLabelStyle: textTheme.labelMedium,
          tabs: const [
            Tab(text: 'Currently Borrowed By'),
            Tab(text: 'Borrowing History'),
            Tab(text: 'Requests Queue'),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 300, // Fixed height for the tab content
          child: TabBarView(
            controller: _tabController,
            children: [
              // Borrowed Now Tab
              _buildBorrowedNowTab(context, textTheme),

              // History Tab
              _buildHistoryTab(context, textTheme),

              // Requests Tab
              _buildRequestsTab(context, textTheme),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBorrowedNowTab(BuildContext context, TextTheme textTheme) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 24, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Error loading data',
              style: textTheme.bodyMedium?.copyWith(color: Colors.red[700]),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage!,
              style: textTheme.bodySmall?.copyWith(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry', style: TextStyle(fontSize: 12)),
            ),
          ],
        ),
      );
    }

    if (_borrowedBooks.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.hourglass_empty, size: 24, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No copies currently borrowed',
              style: textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Text(
              'All copies are available in the library',
              style: textTheme.bodySmall?.copyWith(color: Colors.grey[500]),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      itemCount: _borrowedBooks.length,
      // padding: const EdgeInsets.symmetric(vertical: 8),
      separatorBuilder: (context, index) =>
          const Divider(height: 1, thickness: 1),
      itemBuilder: (context, index) {
        final borrowedBook = _borrowedBooks[index];
        final dueDate =
            borrowedBook.dueDate ?? DateTime.now().add(const Duration(days: 7));
        final borrowDate = borrowedBook.borrowedAt ?? DateTime.now();
        final daysLeft = dueDate.difference(DateTime.now()).inDays;
        final userName = borrowedBook.user?.fullName ?? 'Unknown User';

        return ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          leading: CircleAvatar(
            backgroundColor: Colors.blue[50],
            child: const Icon(
              Icons.person_outline,
              color: Colors.blue,
              size: 32,
            ),
          ),
          title: Text(
            userName,
            style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // const SizedBox(height: 2),
              if (borrowedBook.accessNumber != null)
                Text(
                  'Book Number: ${borrowedBook.accessNumber['number']}',
                  style: textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                    color: Colors.grey[600],
                  ),
                ),
              const SizedBox(height: 4),

              Text(
                'Borrowed: ${_dateFormat.format(borrowDate)}',
                style: textTheme.bodySmall?.copyWith(fontSize: 12),
              ),
              const SizedBox(height: 2),
              Text(
                'Due: ${_dateFormat.format(dueDate)}',
                style: textTheme.bodySmall?.copyWith(
                  color: daysLeft <= 3 ? Colors.red[700] : null,
                  fontWeight: daysLeft <= 3 ? FontWeight.bold : null,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          trailing: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: daysLeft <= 3
                  ? Colors.red[50]
                  : (daysLeft <= 7 ? Colors.orange[50] : Colors.green[50]),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: daysLeft <= 3
                    ? Colors.red[100]!
                    : (daysLeft <= 7
                          ? Colors.orange[100]!
                          : Colors.green[100]!),
                width: 1,
              ),
            ),
            child: Text(
              daysLeft == 1
                  ? '1 day left'
                  : daysLeft > 0
                  ? '$daysLeft days left'
                  : 'Overdue by ${-daysLeft} days',
              style: textTheme.labelMedium?.copyWith(
                color: daysLeft <= 3
                    ? Colors.red[700]
                    : (daysLeft <= 7 ? Colors.orange[700] : Colors.green[700]),
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHistoryTab(BuildContext context, TextTheme textTheme) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 24, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Error loading history',
              style: textTheme.bodyMedium?.copyWith(color: Colors.red[700]),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_borrowingHistory.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history_outlined, size: 24, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No borrowing history',
              style: textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
            ),
            const SizedBox(height: 8),
            Text(
              'This book has no borrowing history yet',
              style: textTheme.bodySmall?.copyWith(color: Colors.grey[500]),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      itemCount: _borrowingHistory.length,
      padding: const EdgeInsets.symmetric(vertical: 8),
      separatorBuilder: (context, index) =>
          const Divider(height: 1, thickness: 1),
      itemBuilder: (context, index) {
        final history = _borrowingHistory[index];
        final borrowDate = history.borrowedAt ?? DateTime.now();
        final returnDate = history.returnedAt ?? DateTime.now();
        final duration = returnDate.difference(borrowDate).inDays;
        final userName = history.user?.fullName ?? 'Unknown User';

        // Determine status and icon based on return status
        bool isLate = history.status == BorrowedBookStatus.overdue;
        bool isReturned = history.status == BorrowedBookStatus.returned;

        final statusText = isLate
            ? 'Returned late'
            : isReturned
            ? 'Returned on time'
            : 'Status: ${history.status.toString().split('.').last}';

        final icon = isLate
            ? Icons.warning_amber_rounded
            : isReturned
            ? Icons.check_circle_outline
            : Icons.history_outlined;

        final color = isLate
            ? Colors.orange
            : isReturned
            ? Colors.green
            : Colors.blue;

        return ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          leading: CircleAvatar(
            backgroundColor: color.withOpacity(0.1),
            child: Icon(icon, color: color, size: 20),
          ),
          title: Text(
            userName,
            style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 4),
              Text(
                '${_dateFormat.format(borrowDate)} - ${_dateFormat.format(returnDate)}',
                style: textTheme.bodySmall?.copyWith(fontSize: 12),
              ),
              const SizedBox(height: 2),
              Text(
                '$statusText • $duration days',
                style: textTheme.bodySmall?.copyWith(
                  color: color,
                  fontSize: 12,
                ),
              ),
              if (history.accessNumber != null) ...[
                const SizedBox(height: 2),
                Text(
                  'Book Number: ${history.accessNumber['number']}',
                  style: textTheme.bodySmall?.copyWith(
                    fontSize: 11,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ],
          ),
          trailing: Icon(icon, color: color.withOpacity(0.7)),
        );
      },
    );
  }

  // This method would need to be implemented in the repository first
  // For now, we'll show a message that this feature is not available
  Future<void> _approveRequest(String requestId) async {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Approving requests is not implemented yet'),
        backgroundColor: Colors.orange,
      ),
    );
  }

  Future<void> _approveFirstInQueue() async {
    if (_pendingRequests.isNotEmpty) {
      await _approveRequest(_pendingRequests.first.id ?? '');
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No pending requests to approve'),
          backgroundColor: Colors.blue,
        ),
      );
    }
  }

  Widget _buildRequestsTab(BuildContext context, TextTheme textTheme) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 24, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Error loading requests',
              style: textTheme.bodyMedium?.copyWith(color: Colors.red[700]),
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _loadData,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    return Column(
      children: [
        if (widget.book.availableCopies > 0 && _pendingRequests.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: _approveFirstInQueue,
                icon: const Icon(Icons.check_circle_outline, size: 16),
                label: const Text(
                  'Approve Next in Queue',
                  style: TextStyle(fontSize: 12),
                ),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                ),
              ),
            ),
          ),
        if (widget.book.availableCopies == 0 && _pendingRequests.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              '${widget.book.availableCopies} copies available • ${_pendingRequests.length} in queue',
              style: textTheme.bodyMedium?.copyWith(
                color: Colors.grey[600],
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        if (_pendingRequests.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 32.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.hourglass_empty, size: 24, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  'No pending requests',
                  style: textTheme.bodyMedium?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'There are no pending requests for this book',
                  style: textTheme.bodySmall?.copyWith(color: Colors.grey[500]),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          )
        else
          Expanded(
            child: ListView.separated(
              itemCount: _pendingRequests.length,
              separatorBuilder: (context, index) =>
                  const Divider(height: 1, thickness: 1),
              itemBuilder: (context, index) {
                final request = _pendingRequests[index];
                final requestDate = request.createdAt ?? DateTime.now();
                final userName = request.user?.fullName ?? 'Unknown User';
                final isFirstInQueue =
                    index == 0 && widget.book.availableCopies > 0;

                return ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  leading: CircleAvatar(
                    backgroundColor: Colors.purple[100],
                    child: Text(
                      '${index + 1}',
                      style: const TextStyle(
                        color: Colors.purple,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    userName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w500,
                      fontSize: 14,
                    ),
                  ),
                  subtitle: Text(
                    'Requested: ${_dateFormat.format(requestDate)}',
                    style: textTheme.bodySmall?.copyWith(fontSize: 12),
                  ),
                  trailing: isFirstInQueue
                      ? FilledButton.tonal(
                          onPressed: () => _approveRequest(request.id ?? ''),
                          style: FilledButton.styleFrom(
                            backgroundColor: Colors.green[50],
                            foregroundColor: Colors.green[800],
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                          ),
                          child: const Text(
                            'Approve',
                            style: TextStyle(fontSize: 12),
                          ),
                        )
                      : Text(
                          'Position: ${index + 1}',
                          style: textTheme.bodySmall?.copyWith(fontSize: 12),
                        ),
                );
              },
            ),
          ),
      ],
    );
  }
}
