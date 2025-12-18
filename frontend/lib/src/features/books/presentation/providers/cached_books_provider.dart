import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/data/repositories/cached_book_repository.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/models/book_details.dart';

// Providers for cached book repository
final cachedBookRepositoryProvider = Provider<CachedBookRepository>((ref) {
  return CachedBookRepository();
});

// State for books list
class BooksListState {
  final List<BookModel> books;
  final bool isLoading;
  final bool isLoadingMore;
  final String? error;
  final int currentPage;
  final bool hasMore;

  const BooksListState({
    this.books = const [],
    this.isLoading = false,
    this.isLoadingMore = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
  });

  BooksListState copyWith({
    List<BookModel>? books,
    bool? isLoading,
    bool? isLoadingMore,
    String? error,
    int? currentPage,
    bool? hasMore,
  }) {
    return BooksListState(
      books: books ?? this.books,
      isLoading: isLoading ?? this.isLoading,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      error: error ?? this.error,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

// Provider for books list state
final booksListProvider =
    StateNotifierProvider<BooksListNotifier, BooksListState>((ref) {
      return BooksListNotifier(ref.read(cachedBookRepositoryProvider));
    });

class BooksListNotifier extends StateNotifier<BooksListState> {
  final CachedBookRepository _repository;

  BooksListNotifier(this._repository) : super(const BooksListState());

  Future<void> loadBooks({
    int page = 1,
    int limit = 10,
    String? search,
    String? category,
    String? type,
    int? minAvailable,
    String? sortBy,
    String? sortOrder,
    bool refresh = false,
  }) async {
    if (refresh) {
      state = state.copyWith(isLoading: true, error: null);
    } else if (page == 1) {
      state = state.copyWith(isLoading: true, error: null);
    } else {
      state = state.copyWith(isLoadingMore: true, error: null);
    }

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
        forceRefresh: refresh,
      );

      if (page == 1) {
        state = state.copyWith(
          books: response.items,
          isLoading: false,
          currentPage: response.currentPage,
          hasMore: response.currentPage < response.totalPages,
        );
      } else {
        final updatedBooks = [...state.books, ...response.items];
        state = state.copyWith(
          books: updatedBooks,
          isLoadingMore: false,
          currentPage: response.currentPage,
          hasMore: response.currentPage < response.totalPages,
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isLoadingMore: false,
        error: e.toString(),
      );
    }
  }

  Future<void> loadMoreBooks({
    String? search,
    String? category,
    String? type,
    int? minAvailable,
    String? sortBy,
    String? sortOrder,
  }) async {
    if (state.isLoadingMore || !state.hasMore) return;

    await loadBooks(
      page: state.currentPage + 1,
      search: search,
      category: category,
      type: type,
      minAvailable: minAvailable,
      sortBy: sortBy,
      sortOrder: sortOrder,
    );
  }

  Future<void> refreshBooks({
    String? search,
    String? category,
    String? type,
    int? minAvailable,
    String? sortBy,
    String? sortOrder,
  }) async {
    await loadBooks(
      page: 1,
      search: search,
      category: category,
      type: type,
      minAvailable: minAvailable,
      sortBy: sortBy,
      sortOrder: sortOrder,
      refresh: true,
    );
  }

  Future<void> searchBooks(String query) async {
    await refreshBooks(search: query);
  }

  Future<void> filterByCategory(String category) async {
    await refreshBooks(category: category);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// State for book details
class BookDetailsState {
  final BookDetails? book;
  final bool isLoading;
  final String? error;

  const BookDetailsState({this.book, this.isLoading = false, this.error});

  BookDetailsState copyWith({
    BookDetails? book,
    bool? isLoading,
    String? error,
  }) {
    return BookDetailsState(
      book: book ?? this.book,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

// Provider for book details state
final bookDetailsProvider =
    StateNotifierProvider.family<BookDetailsNotifier, BookDetailsState, int>((
      ref,
      bookId,
    ) {
      return BookDetailsNotifier(
        ref.read(cachedBookRepositoryProvider),
        bookId,
      );
    });

class BookDetailsNotifier extends StateNotifier<BookDetailsState> {
  final CachedBookRepository _repository;
  final int _bookId;

  BookDetailsNotifier(this._repository, this._bookId)
    : super(const BookDetailsState());

  Future<void> loadBookDetails({bool refresh = false}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final book = await _repository.getBookDetails(
        _bookId,
        forceRefresh: refresh,
      );
      state = state.copyWith(book: book, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> refreshBookDetails() async {
    await loadBookDetails(refresh: true);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// Provider for search suggestions
final searchSuggestionsProvider = FutureProvider.family<List<String>, String>((
  ref,
  query,
) async {
  if (query.length < 2) return [];

  final repository = ref.read(cachedBookRepositoryProvider);
  try {
    final response = await repository.searchBooks(query: query, limit: 5);
    return response.items.map((book) => book.title).take(5).toList();
  } catch (e) {
    return [];
  }
});

// Provider for popular books (preloaded)
final popularBooksProvider = FutureProvider<List<BookModel>>((ref) async {
  final repository = ref.read(cachedBookRepositoryProvider);
  try {
    await repository.preloadPopularBooks();
    final response = await repository.getBooks(page: 1, limit: 10);
    return response.items;
  } catch (e) {
    return [];
  }
});

// Provider for books by category
final booksByCategoryProvider = FutureProvider.family<List<BookModel>, String>((
  ref,
  category,
) async {
  final repository = ref.read(cachedBookRepositoryProvider);
  try {
    final response = await repository.getBooksByCategory(category, limit: 10);
    return response.items;
  } catch (e) {
    return [];
  }
});

// Cache management provider
final cacheManagementProvider = Provider<CacheManagementNotifier>((ref) {
  return CacheManagementNotifier(ref.read(cachedBookRepositoryProvider));
});

class CacheManagementNotifier {
  final CachedBookRepository _repository;

  CacheManagementNotifier(this._repository);

  Future<void> invalidateBooksCache() async {
    await _repository.invalidateBooksCache();
  }

  Future<void> invalidateBookDetailsCache(int bookId) async {
    await _repository.invalidateBookDetailsCache(bookId);
  }

  Future<void> invalidateAllBooksCache() async {
    await _repository.invalidateAllBooksCache();
  }

  Future<void> preloadPopularBooks() async {
    await _repository.preloadPopularBooks();
  }

  Map<String, dynamic> getCacheStats() {
    return _repository.getCacheStats();
  }

  Future<void> cleanupExpiredCache() async {
    await _repository.cleanupExpiredCache();
  }
}
