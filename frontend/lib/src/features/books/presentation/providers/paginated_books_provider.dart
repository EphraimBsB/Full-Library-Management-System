import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/data/repositories/cached_book_repository.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/core/data/base_repository.dart';

/// State for paginated books list
class PaginatedBooksState {
  final List<BookModel> books;
  final int currentPage;
  final int totalPages;
  final int totalItems;
  final int itemsPerPage;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final String searchQuery;
  final String? category;
  final int? minAvailable;
  final String? type;
  final String? sortBy;
  final String? sortOrder;

  const PaginatedBooksState({
    this.books = const [],
    this.currentPage = 1,
    this.totalPages = 1,
    this.totalItems = 0,
    this.itemsPerPage = 10,
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.searchQuery = '',
    this.category,
    this.minAvailable,
    this.type,
    this.sortBy,
    this.sortOrder,
  });

  PaginatedBooksState copyWith({
    List<BookModel>? books,
    int? currentPage,
    int? totalPages,
    int? totalItems,
    int? itemsPerPage,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    String? searchQuery,
    String? category,
    int? minAvailable,
    String? type,
    String? sortBy,
    String? sortOrder,
  }) {
    return PaginatedBooksState(
      books: books ?? this.books,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      totalItems: totalItems ?? this.totalItems,
      itemsPerPage: itemsPerPage ?? this.itemsPerPage,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error ?? this.error,
      searchQuery: searchQuery ?? this.searchQuery,
      category: category ?? this.category,
      minAvailable: minAvailable ?? this.minAvailable,
      type: type ?? this.type,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is PaginatedBooksState &&
        other.books == books &&
        other.currentPage == currentPage &&
        other.totalPages == totalPages &&
        other.totalItems == totalItems &&
        other.itemsPerPage == itemsPerPage &&
        other.isLoading == isLoading &&
        other.isLoadingMore == isLoadingMore &&
        other.error == error &&
        other.searchQuery == searchQuery &&
        other.category == category &&
        other.minAvailable == minAvailable &&
        other.type == type &&
        other.sortBy == sortBy &&
        other.sortOrder == sortOrder;
  }

  @override
  int get hashCode {
    return Object.hash(
      books,
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      isLoading,
      isLoadingMore,
      error,
      searchQuery,
      category,
      minAvailable,
      type,
      sortBy,
      sortOrder,
    );
  }
}

/// Notifier for managing paginated books state
class PaginatedBooksNotifier extends StateNotifier<PaginatedBooksState> {
  final CachedBookRepository _repository;

  PaginatedBooksNotifier(this._repository) : super(const PaginatedBooksState());

  /// Load books for a specific page
  Future<void> loadPage({
    required int page,
    int limit = 10,
    String? search,
    String? category,
    String? type,
    int? minAvailable,
    String? sortBy,
    String? sortOrder,
    bool forceRefresh = false,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _repository.getBooks(
        page: page,
        limit: limit,
        search: search,
        category: category,
        type: type,
        minAvailable: minAvailable,
        sortBy: sortBy,
        sortOrder: sortOrder,
        forceRefresh: forceRefresh,
      );

      if (!mounted) return;

      state = state.copyWith(
        books: response.items,
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems,
        itemsPerPage: response.itemsPerPage,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Navigate to a specific page
  Future<void> goToPage(int page) async {
    if (page < 1 || page > state.totalPages) return;
    if (page == state.currentPage) return;

    await loadPage(
      page: page,
      limit: state.itemsPerPage,
      search: state.searchQuery.isEmpty ? null : state.searchQuery,
      category: state.category,
      type: state.type,
      minAvailable: state.minAvailable,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
    );
  }

  /// Change the number of items per page
  Future<void> changeItemsPerPage(int newLimit) async {
    if (newLimit == state.itemsPerPage) return;

    await loadPage(
      page: 1,
      limit: newLimit,
      search: state.searchQuery.isEmpty ? null : state.searchQuery,
      category: state.category,
      type: state.type,
      minAvailable: state.minAvailable,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
    );
  }

  /// Apply filters and reset to first page
  Future<void> applyFilters({
    String? search,
    String? category,
    String? type,
    int? minAvailable,
    String? sortBy,
    String? sortOrder,
  }) async {
    await loadPage(
      page: 1,
      limit: state.itemsPerPage,
      search: search,
      category: category,
      type: type,
      minAvailable: minAvailable,
      sortBy: sortBy,
      sortOrder: sortOrder,
    );
  }

  /// Clear all filters and reload
  Future<void> clearFilters() async {
    await applyFilters(
      search: '',
      category: null,
      type: null,
      minAvailable: null,
      sortBy: null,
      sortOrder: null,
    );
  }

  /// Refresh current page
  Future<void> refresh() async {
    await loadPage(
      page: state.currentPage,
      limit: state.itemsPerPage,
      search: state.searchQuery.isEmpty ? null : state.searchQuery,
      category: state.category,
      type: state.type,
      minAvailable: state.minAvailable,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      forceRefresh: true,
    );
  }

  /// Clear error state
  void clearError() {
    state = state.copyWith(error: null);
  }

  /// Locally add a book (Optimistic Update)
  void addBook(BookModel book) {
    state = state.copyWith(
      books: [book, ...state.books],
      totalItems: state.totalItems + 1,
    );
  }

  /// Locally update a book (Optimistic Update)
  void updateBook(BookModel updatedBook) {
    state = state.copyWith(
      books: state.books
          .map((b) => b.id == updatedBook.id ? updatedBook : b)
          .toList(),
    );
  }

  /// Locally delete a book (Optimistic Update)
  void deleteBook(int bookId) {
    final originalCount = state.books.length;
    final updatedBooks = state.books.where((b) => b.id != bookId).toList();

    if (updatedBooks.length < originalCount) {
      state = state.copyWith(
        books: updatedBooks,
        totalItems: state.totalItems - 1,
      );
    }
  }
}

// Provider for the paginated books repository
final cachedBookRepositoryProvider = Provider<CachedBookRepository>((ref) {
  return CachedBookRepository();
});

// Provider for the paginated books notifier
final paginatedBooksProvider =
    StateNotifierProvider<PaginatedBooksNotifier, PaginatedBooksState>((ref) {
      return PaginatedBooksNotifier(ref.read(cachedBookRepositoryProvider));
    });

// Provider for current paginated response (for use with pagination widget)
final currentPaginatedBooksProvider = Provider<PaginatedResponse<BookModel>>((
  ref,
) {
  final state = ref.watch(paginatedBooksProvider);
  return PaginatedResponse<BookModel>(
    items: state.books,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    totalItems: state.totalItems,
    itemsPerPage: state.itemsPerPage,
  );
});
