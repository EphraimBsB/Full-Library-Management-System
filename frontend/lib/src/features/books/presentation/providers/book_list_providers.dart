import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/repositories/book_repository.dart';
import 'package:management_side/src/features/books/data/repositories/book_repository_impl.dart';

final bookRepositoryProvider = Provider<BookRepository>((ref) {
  return BookRepositoryImpl();
});
final allBooksProvider = FutureProvider.autoDispose<List<BookModel>>((
  ref,
) async {
  final repository = ref.watch(bookRepositoryProvider);
  final result = await repository.getBooks();
  return result.when(
    success: (paginatedBooks) => paginatedBooks.items,
    failure: (error, stackTrace) {
      print('Error loading books: $error');
      if (stackTrace != null) {
        print('Stack trace: $stackTrace');
      }
      return [];
    },
  );
});
