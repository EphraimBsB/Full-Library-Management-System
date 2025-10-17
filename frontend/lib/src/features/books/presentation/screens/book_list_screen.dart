import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_book_card.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/presentation/providers/book_list_providers.dart';
import 'package:management_side/src/features/books/presentation/screens/book_details_screen.dart';
import 'package:management_side/src/features/dashboard/presentation/widgets/topbar.dart'
    as dashboard;

class BookListScreen extends StatefulWidget {
  const BookListScreen({super.key});

  @override
  State<BookListScreen> createState() => _BookListScreenState();
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

class _BookListScreenState extends State<BookListScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  BookStatus _selectedStatus = BookStatus.all;
  BookSortOption _currentSortOption = BookSortOption.titleAsc;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.toLowerCase();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
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
        return 'Year (Oldest)';
      case BookSortOption.yearDesc:
        return 'Year (Newest)';
      case BookSortOption.dateAddedDesc:
        return 'Recently Added';
      case BookSortOption.dateAddedAsc:
        return 'Oldest Added';
    }
  }

  List<BookModel> _filterAndSortBooks(List<BookModel> books) {
    // Apply search filter
    var filteredBooks = books.where((book) {
      if (_searchQuery.isEmpty) return true;

      final titleMatch = book.title.toLowerCase().contains(_searchQuery);
      final authorMatch = book.author.toLowerCase().contains(_searchQuery);
      final isbnMatch = book.isbn!.toLowerCase().contains(_searchQuery);

      return titleMatch || authorMatch || isbnMatch;
    }).toList();

    // Apply status filter
    if (_selectedStatus != BookStatus.all) {
      filteredBooks = filteredBooks.where((book) {
        final isAvailable =
            book.availableCopies != null && book.availableCopies! > 0;
        return _selectedStatus == BookStatus.available
            ? isAvailable
            : !isAvailable;
      }).toList();
    }

    // Apply sorting
    filteredBooks.sort((a, b) {
      switch (_currentSortOption) {
        case BookSortOption.titleAsc:
          return a.title.compareTo(b.title);
        case BookSortOption.titleDesc:
          return b.title.compareTo(a.title);
        case BookSortOption.authorAsc:
          final authorA = a.author;
          final authorB = b.author;
          return authorA.compareTo(authorB);
        case BookSortOption.authorDesc:
          final authorA = a.author;
          final authorB = b.author;
          return authorB.compareTo(authorA);
        case BookSortOption.yearAsc:
          return (a.publicationYear ?? 0).compareTo(b.publicationYear ?? 0);
        case BookSortOption.yearDesc:
          return (b.publicationYear ?? 0).compareTo(a.publicationYear ?? 0);
        case BookSortOption.dateAddedDesc:
          return (b.createdAt ?? DateTime.now()).compareTo(
            a.createdAt ?? DateTime.now(),
          );
        case BookSortOption.dateAddedAsc:
          return (a.createdAt ?? DateTime.now()).compareTo(
            b.createdAt ?? DateTime.now(),
          );
      }
    });

    return filteredBooks;
  }

  Widget _buildBookList(List<BookModel> books, WidgetRef ref) {
    final filteredBooks = _filterAndSortBooks(books);

    return Column(
      children: [
        _buildFilterAndSortBar(ref),
        const SizedBox(height: 8),
        Expanded(
          child: filteredBooks.isEmpty
              ? const Center(
                  child: Text('No books found. Try adjusting your filters.'),
                )
              : GridView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 6,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: filteredBooks.length,
                  itemBuilder: (context, index) {
                    final book = filteredBooks[index];
                    return buildBookCard(
                      book,
                      onTap: () {
                        showBookDetailsDialog(
                          context: context,
                          bookId: book.id!,
                        );
                      },
                    );
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildFilterAndSortBar(WidgetRef ref) {
    final searchNotifier = ref.watch(searchNotifierProvider);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.white,
      child: Row(
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
              onSubmitted: (value) => searchNotifier(value),
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
                        status.toString().split('.').last,
                        style: const TextStyle(fontSize: 14),
                      ),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _selectedStatus = value;
                      });
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
                    }
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Consumer(
        builder: (context, ref, _) {
          final booksAsync = ref.watch(allBooksProvider);

          return Column(
            children: [
              const dashboard.TopbarWidget(),
              Expanded(
                child: booksAsync.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (error, stack) => Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        'Error loading books. Please try again.\n$error',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  ),
                  data: (books) {
                    if (books.isEmpty) {
                      return const Center(
                        child: Text('No books found in the library.'),
                      );
                    }
                    return _buildBookList(books, ref);
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
