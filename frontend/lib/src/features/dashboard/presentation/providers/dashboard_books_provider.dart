import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart'
    as model;
import 'package:management_side/src/features/books/domain/repositories/book_repository.dart';
import 'package:management_side/src/features/books/data/repositories/book_repository_impl.dart';

// Helper function to sort books by date (newest first)
List<model.BookModel> _sortByDate(List<model.BookModel> books) {
  books.sort((a, b) => b.createdAt.compareTo(a.createdAt));
  return books;
}

// Helper function to sort books by rating (highest first)
List<model.BookModel> _sortByRating(List<model.BookModel> books) {
  books.sort((a, b) => b.rating.compareTo(a.rating));
  return books;
}

// Helper function to sort books by total copies (most copies first)
List<model.BookModel> _sortByTotalCopies(List<model.BookModel> books) {
  books.sort((a, b) => b.totalCopies.compareTo(a.totalCopies));
  return books;
}

// Provider for the book repository
final bookRepositoryProvider = Provider<BookRepository>((ref) {
  return BookRepositoryImpl();
});

final recentlyAddedBooksProvider =
    FutureProvider.autoDispose<List<model.BookModel>>((ref) async {
      final repository = ref.watch(bookRepositoryProvider);
      final result = await repository.getBooks();
      return result.when(
        success: (paginatedBooks) =>
            _sortByDate(paginatedBooks.items).take(10).toList(),
        failure: (error, stackTrace) {
          // In a real app, you might want to handle this error more gracefully
          print('Error loading recently added books: $error');
          if (stackTrace != null) {
            print('Stack trace: $stackTrace');
          }
          return [];
        },
      );
    });

final topRatedBooksProvider = FutureProvider.autoDispose<List<model.BookModel>>(
  (ref) async {
    final repository = ref.watch(bookRepositoryProvider);
    final result = await repository.getBooks();
    return result.when(
      success: (paginatedBooks) =>
          _sortByRating(paginatedBooks.items).take(10).toList(),
      failure: (error, stackTrace) {
        print('Error loading top rated books: $error');
        if (stackTrace != null) {
          print('Stack trace: $stackTrace');
        }
        return [];
      },
    );
  },
);

final mostBorrowedBooksProvider =
    FutureProvider.autoDispose<List<model.BookModel>>((ref) async {
      final repository = ref.watch(bookRepositoryProvider);
      final result = await repository.getBooks();
      return result.when(
        success: (paginatedBooks) =>
            _sortByTotalCopies(paginatedBooks.items).take(10).toList(),
        failure: (error, stackTrace) {
          print('Error loading most borrowed books: $error');
          if (stackTrace != null) {
            print('Stack trace: $stackTrace');
          }
          return [];
        },
      );
    });
