import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_book_card.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/presentation/providers/paginated_books_provider.dart';
import 'package:management_side/src/features/books/presentation/screens/book_details_screen.dart';
import 'package:management_side/src/core/widgets/numbered_pagination_widget.dart';
import 'package:management_side/src/features/dashboard/presentation/widgets/topbar.dart'
    as dashboard;

class PaginatedBookListScreen extends ConsumerStatefulWidget {
  const PaginatedBookListScreen({super.key});

  @override
  ConsumerState<PaginatedBookListScreen> createState() =>
      _PaginatedBookListScreenState();
}

enum BookStatus { all, available, unavailable }

enum BookSortOption {
  titleAsc,
  titleDesc,
  authorAsc,
  authorDesc,
  yearAsc,
  yearDesc,
  dateAddedDesc,
  dateAddedAsc,
}

class _PaginatedBookListScreenState
    extends ConsumerState<PaginatedBookListScreen> {
  final TextEditingController _searchController = TextEditingController();
  BookStatus _selectedStatus = BookStatus.all;
  BookSortOption _currentSortOption = BookSortOption.titleAsc;
  String _searchQuery = '';
  int _itemsPerPage = 10;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });

    // Load initial data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialData();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _loadInitialData() {
    final notifier = ref.read(paginatedBooksProvider.notifier);
    notifier.loadPage(page: 1, limit: _itemsPerPage);
  }

  void _applyFilters() {
    final notifier = ref.read(paginatedBooksProvider.notifier);

    // Map status filter to backend parameter
    int? minAvailable;
    switch (_selectedStatus) {
      case BookStatus.all:
        minAvailable = null;
        break;
      case BookStatus.available:
        minAvailable = 1; // At least 1 copy available
        break;
      case BookStatus.unavailable:
        minAvailable = 0; // No copies available
        break;
    }

    // Map sort option to backend parameters
    String? sortBy;
    String? sortOrder;
    switch (_currentSortOption) {
      case BookSortOption.titleAsc:
        sortBy = 'title';
        sortOrder = 'ASC';
        break;
      case BookSortOption.titleDesc:
        sortBy = 'title';
        sortOrder = 'DESC';
        break;
      case BookSortOption.authorAsc:
        sortBy = 'author';
        sortOrder = 'ASC';
        break;
      case BookSortOption.authorDesc:
        sortBy = 'author';
        sortOrder = 'DESC';
        break;
      case BookSortOption.yearAsc:
        sortBy = 'publication_year';
        sortOrder = 'ASC';
        break;
      case BookSortOption.yearDesc:
        sortBy = 'publication_year';
        sortOrder = 'DESC';
        break;
      case BookSortOption.dateAddedDesc:
        sortBy = 'created_at';
        sortOrder = 'DESC';
        break;
      case BookSortOption.dateAddedAsc:
        sortBy = 'created_at';
        sortOrder = 'ASC';
        break;
    }

    notifier.applyFilters(
      search: _searchQuery.isEmpty ? '' : _searchQuery,
      minAvailable: minAvailable,
      sortBy: sortBy,
      sortOrder: sortOrder,
    );
  }

  void _onPageChanged(int page) {
    final notifier = ref.read(paginatedBooksProvider.notifier);
    notifier.goToPage(page);
  }

  void _onItemsPerPageChanged(int newLimit) {
    setState(() {
      _itemsPerPage = newLimit;
    });
    final notifier = ref.read(paginatedBooksProvider.notifier);
    notifier.changeItemsPerPage(newLimit);
  }

  Future<void> _refresh() async {
    final notifier = ref.read(paginatedBooksProvider.notifier);
    await notifier.refresh();
  }

  Widget _buildBookList(List<BookModel> books) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: Column(
        children: [
          // Books grid
          Expanded(
            child: GridView.builder(
              controller: ScrollController(),
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 6,
                childAspectRatio: 0.7,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: books.length,
              itemBuilder: (context, index) {
                final book = books[index];
                return buildBookCard(
                  book,
                  onTap: () {
                    showBookDetailsDialog(context: context, bookId: book.id!);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterAndSortBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.white,
      child: Column(
        children: [
          // Search and filters row
          Row(
            children: [
              // Search field
              Expanded(
                flex: 4,
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search by title, author, or ISBN',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: Colors.grey[100],
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                  ),
                  onSubmitted: (value) => _applyFilters(),
                ),
              ),
              const SizedBox(width: 16),

              // Status filter dropdown
              Expanded(
                flex: 2,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<BookStatus>(
                      value: _selectedStatus,
                      isExpanded: true,
                      icon: const Icon(Icons.arrow_drop_down),
                      items: BookStatus.values.map((status) {
                        return DropdownMenuItem(
                          value: status,
                          child: Text(
                            _getStatusName(status),
                            style: const TextStyle(fontSize: 14),
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            _selectedStatus = value;
                          });
                          _applyFilters();
                        }
                      },
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),

              // Sort dropdown
              Expanded(
                flex: 2,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<BookSortOption>(
                      value: _currentSortOption,
                      isExpanded: true,
                      icon: const Icon(Icons.sort),
                      items: BookSortOption.values.map((option) {
                        return DropdownMenuItem(
                          value: option,
                          child: Text(
                            _getSortOptionName(option),
                            style: const TextStyle(fontSize: 14),
                          ),
                        );
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          setState(() {
                            _currentSortOption = value;
                          });
                          _applyFilters();
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Items per page and pagination info row
          Consumer(
            builder: (context, ref, _) {
              final state = ref.watch(paginatedBooksProvider);

              return Row(
                children: [
                  // Items per page selector
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<int>(
                        value: _itemsPerPage,
                        isExpanded: false,
                        icon: const Icon(Icons.arrow_drop_down),
                        items: [5, 10, 20, 50].map((value) {
                          return DropdownMenuItem(
                            value: value,
                            child: Text(
                              '$value per page',
                              style: const TextStyle(fontSize: 14),
                            ),
                          );
                        }).toList(),
                        onChanged: (value) {
                          if (value != null) {
                            _onItemsPerPageChanged(value);
                          }
                        },
                      ),
                    ),
                  ),

                  const Spacer(),

                  // Pagination info
                  if (state.totalItems > 0)
                    Text(
                      'Showing ${state.books.length} of ${state.totalItems} books (Page ${state.currentPage}/${state.totalPages})',
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  String _getStatusName(BookStatus status) {
    switch (status) {
      case BookStatus.all:
        return 'All Books';
      case BookStatus.available:
        return 'Available';
      case BookStatus.unavailable:
        return 'Unavailable';
    }
  }

  String _getSortOptionName(BookSortOption option) {
    switch (option) {
      case BookSortOption.titleAsc:
        return 'Title (A-Z)';
      case BookSortOption.titleDesc:
        return 'Title (Z-A)';
      case BookSortOption.authorAsc:
        return 'Author (A-Z)';
      case BookSortOption.authorDesc:
        return 'Author (Z-A)';
      case BookSortOption.yearAsc:
        return 'Year (Old-New)';
      case BookSortOption.yearDesc:
        return 'Year (New-Old)';
      case BookSortOption.dateAddedDesc:
        return 'Date (New-Old)';
      case BookSortOption.dateAddedAsc:
        return 'Date (Old-New)';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Consumer(
        builder: (context, ref, _) {
          final state = ref.watch(paginatedBooksProvider);
          final paginatedData = ref.watch(currentPaginatedBooksProvider);

          return Column(
            children: [
              const dashboard.TopbarWidget(),
              _buildFilterAndSortBar(),

              // Main content area
              Expanded(
                child: state.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : state.error != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'Error loading books. Please try again.\n${state.error}',
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.red),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _refresh,
                                child: const Text('Retry'),
                              ),
                            ],
                          ),
                        ),
                      )
                    : state.books.isEmpty
                    ? const Center(
                        child: Text('No books found matching your criteria.'),
                      )
                    : Column(
                        children: [
                          // Books list
                          Expanded(child: _buildBookList(state.books)),

                          // Pagination controls
                          NumberedPaginationWidget<BookModel>(
                            data: paginatedData,
                            onPageChanged: _onPageChanged,
                            maxVisiblePages: 7,
                            inactiveColor: AppTheme.textSecondaryColor,
                          ),
                        ],
                      ),
              ),
            ],
          );
        },
      ),
    );
  }
}
