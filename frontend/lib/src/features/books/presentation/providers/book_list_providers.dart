import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/models/inhouse_usage_model.dart';
import 'package:management_side/src/features/books/domain/repositories/book_repository.dart';
import 'package:management_side/src/features/books/data/repositories/book_repository_impl.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';

import 'package:management_side/src/core/services/cache_service.dart';

// Debouncer for search
class _Debouncer {
  final Duration delay;
  Timer? _timer;

  _Debouncer({this.delay = const Duration(milliseconds: 500)});

  void call(void Function() callback) {
    _timer?.cancel();
    _timer = Timer(delay, callback);
  }

  void dispose() {
    _timer?.cancel();
  }
}

// Repository provider
final bookRepositoryProvider = Provider<BookRepository>((ref) {
  return BookRepositoryImpl();
});

// Search query state
final searchQueryProvider = StateProvider<String>((ref) => '');

// Debounced search query
final debouncedSearchQueryProvider = StateProvider<String>((ref) => '');

// Books state for non-paginated list
class BooksState {
  final List<BookModel> books;
  final bool isLoading;
  final String? error;

  BooksState({this.books = const [], this.isLoading = false, this.error});

  BooksState copyWith({
    List<BookModel>? books,
    bool? isLoading,
    String? error,
  }) {
    return BooksState(
      books: books ?? this.books,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class BooksNotifier extends StateNotifier<BooksState> {
  final BookRepository _repository;
  final Ref _ref;

  BooksNotifier(this._repository, this._ref) : super(BooksState()) {
    loadBooks();

    // Correctly listen to search changes to trigger re-fetch
    _ref.listen(debouncedSearchQueryProvider, (previous, next) {
      if (previous != next) {
        loadBooks();
      }
    });
  }

  Future<void> loadBooks() async {
    state = state.copyWith(isLoading: true, error: null);
    final searchQuery = _ref.read(debouncedSearchQueryProvider);

    final result = await _repository.getBooks(
      search: searchQuery.isEmpty ? null : searchQuery,
    );

    if (!mounted) return;

    state = result.when(
      success: (paginatedBooks) =>
          state.copyWith(books: paginatedBooks.items, isLoading: false),
      failure: (error, stackTrace) =>
          state.copyWith(isLoading: false, error: error.toString()),
    );
  }

  void addBook(BookModel book) {
    state = state.copyWith(books: [book, ...state.books]);
  }

  void updateBook(BookModel book) {
    state = state.copyWith(
      books: state.books.map((b) => b.id == book.id ? book : b).toList(),
    );
  }

  void deleteBook(int id) {
    state = state.copyWith(
      books: state.books.where((b) => b.id != id).toList(),
    );
  }
}

final booksNotifierProvider =
    StateNotifierProvider.autoDispose<BooksNotifier, BooksState>((ref) {
      return BooksNotifier(ref.watch(bookRepositoryProvider), ref);
    });

// For backward compatibility and specialized use cases
final allBooksProvider = Provider.autoDispose<AsyncValue<List<BookModel>>>((
  ref,
) {
  final booksState = ref.watch(booksNotifierProvider);
  if (booksState.isLoading) return const AsyncValue.loading();
  if (booksState.error != null)
    return AsyncValue.error(booksState.error!, StackTrace.current);
  return AsyncValue.data(booksState.books);
});

// Search notifier with debouncing
final searchNotifierProvider = Provider<Function(String)>((ref) {
  final debouncer = _Debouncer();
  final notifier = ref.read(debouncedSearchQueryProvider.notifier);

  ref.onDispose(() {
    debouncer.dispose();
  });

  return (String query) {
    // Update the search query immediately for UI feedback
    ref.read(searchQueryProvider.notifier).state = query;

    // Debounce the actual search
    debouncer(() {
      notifier.state = query;
    });
  };
});

final bookNotesProvider = FutureProvider.family<List<BookNote>, int>((
  ref,
  int bookId,
) async {
  final repository = ref.watch(bookRepositoryProvider);

  return repository
      .getBookNotes(bookId)
      .then(
        (result) => result.when(
          success: (notes) => notes,
          failure: (error, stackTrace) {
            print('Error loading book notes: $error');
            return [];
          },
        ),
      );
});

final createBookNoteProvider = FutureProvider.family<BookNote, BookNote>((
  ref,
  bookNote,
) async {
  final repository = ref.watch(bookRepositoryProvider);
  final result = await repository.createBookNote(bookNote);
  return result.when(
    success: (note) => note,
    failure: (error, stackTrace) {
      throw error; // Or handle the error as needed
    },
  );
});

final updateBookNoteProvider = FutureProvider.family<BookNote, BookNote>((
  ref,
  bookNote,
) async {
  final repository = ref.watch(bookRepositoryProvider);
  final result = await repository.updateBookNote(bookNote, bookNote.id!);
  return result.when(
    success: (note) => note,
    failure: (error, stackTrace) {
      throw error; // Or handle the error as needed
    },
  );
});

final deleteBookNoteProvider = FutureProvider.family<void, String>((
  ref,
  id,
) async {
  final repository = ref.watch(bookRepositoryProvider);
  final result = await repository.deleteBookNote(id);
  return result.when(
    success: (_) => null,
    failure: (error, stackTrace) {
      throw error; // Or handle the error as needed
    },
  );
});

final getBookNoteProvider = FutureProvider.family<BookNote, String>((
  ref,
  id,
) async {
  final repository = ref.watch(bookRepositoryProvider);
  final result = await repository.getBookNote(id);
  return result.when(
    success: (note) => note,
    failure: (error, stackTrace) {
      throw error; // Or handle the error as needed
    },
  );
});

final selectedStatus = StateProvider<InhouseUsageStatus>(
  (ref) => InhouseUsageStatus.active,
);

final historyStatus = StateProvider<InhouseUsageStatus>(
  (ref) => InhouseUsageStatus.completed,
);

final activeUserSessionProvider = FutureProvider.autoDispose<InhouseUsage?>((
  ref,
) async {
  final repository = ref.watch(bookRepositoryProvider);
  final result = await repository.getHistoryInhouseUsages(
    status: InhouseUsageStatus.active,
  );

  return result.when(
    success: (response) =>
        response.items.isNotEmpty ? response.items.first : null,
    failure: (_, __) => null,
  );
});

final inhouseUsagesProvider =
    FutureProvider.autoDispose<InhouseUsageListResponse>((ref) async {
      final repository = ref.watch(bookRepositoryProvider);
      final status = ref.watch(selectedStatus);

      return repository
          .getAllInhouseUsages(status: status)
          .then(
            (result) => result.when(
              success: (inhouseUsages) => inhouseUsages,
              failure: (error, stackTrace) {
                print('Error loading in-house usages: $error');
                return InhouseUsageListResponse(items: [], total: 0);
              },
            ),
          );
    });

final historyInhouseUsagesProvider =
    FutureProvider.autoDispose<InhouseUsageListResponse>((ref) async {
      final repository = ref.watch(bookRepositoryProvider);
      final status = ref.watch(historyStatus);

      return repository
          .getHistoryInhouseUsages(status: status)
          .then(
            (result) => result.when(
              success: (inhouseUsages) => inhouseUsages,
              failure: (error, stackTrace) {
                print('Error loading history in-house usages: $error');
                return InhouseUsageListResponse(items: [], total: 0);
              },
            ),
          );
    });

final startInhouseUsageProvider =
    FutureProvider.family<Map<String, dynamic>, Map<String, dynamic>>((
      ref,
      data,
    ) async {
      final repository = ref.watch(bookRepositoryProvider);
      final result = await repository.startInhouseUsage(data);
      return result.when(
        success: (inhouseUsage) async {
          // Invalidate caches to show updated counts
          await CacheService().invalidateBookCaches(bookId: data['bookId']);
          ref.invalidate(inhouseUsagesProvider);
          ref.invalidate(activeUserSessionProvider);
          ref.invalidate(booksNotifierProvider);
          ref.invalidate(inhouseUsageCountsProvider);
          return inhouseUsage;
        },
        failure: (error, stackTrace) {
          print('Error starting in-house usage: $error');
          throw error;
        },
      );
    });

final endInhouseUsageProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
      final repository = ref.watch(bookRepositoryProvider);
      final result = await repository.endInhouseUsage(id);
      return result.when(
        success: (inhouseUsage) async {
          // Invalidate caches to show updated counts
          // We need bookId for specific invalidation, but we can clear all books if not available
          // Actually, inhouseUsage usually has copy.book.id
          final bookId = inhouseUsage['copy']?['book']?['id'];
          await CacheService().invalidateBookCaches(bookId: bookId);

          ref.invalidate(inhouseUsagesProvider);
          ref.invalidate(historyInhouseUsagesProvider);
          ref.invalidate(activeUserSessionProvider);
          ref.invalidate(booksNotifierProvider);
          ref.invalidate(inhouseUsageCountsProvider);
          return inhouseUsage;
        },
        failure: (error, stackTrace) {
          throw error;
        },
      );
    });

final forceEndInhouseUsageProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, id) async {
      final repository = ref.watch(bookRepositoryProvider);
      final result = await repository.forceEndInhouseUsage(id);
      return result.when(
        success: (inhouseUsage) {
          ref.invalidate(inhouseUsagesProvider);
          ref.invalidate(inhouseUsageCountsProvider);
          return inhouseUsage;
        },
        failure: (error, stackTrace) {
          throw error; // Or handle the error as needed
        },
      );
    });

final inhouseUsageCountsProvider = FutureProvider.autoDispose<Map<String, int>>(
  (ref) async {
    final repository = ref.watch(bookRepositoryProvider);
    final result = await repository.getInhouseUsageCounts();

    return result.when(
      success: (counts) => counts,
      failure: (_, __) => {
        'active': 0,
        'completed': 0,
        'force_ended': 0,
        'cancelled': 0,
      },
    );
  },
);
