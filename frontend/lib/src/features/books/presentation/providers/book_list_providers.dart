import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/repositories/book_repository.dart';
import 'package:management_side/src/features/books/data/repositories/book_repository_impl.dart';

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

// Books provider with search functionality
final allBooksProvider = FutureProvider.autoDispose<List<BookModel>>((
  ref,
) async {
  // Watch for changes to the debounced search query
  final searchQuery = ref.watch(debouncedSearchQueryProvider);
  final repository = ref.watch(bookRepositoryProvider);

  return repository
      .getBooks(search: searchQuery.isEmpty ? null : searchQuery)
      .then(
        (result) => result.when(
          success: (paginatedBooks) => paginatedBooks.items,
          failure: (error, stackTrace) {
            print('Error loading books: $error');
            return [];
          },
        ),
      );
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
