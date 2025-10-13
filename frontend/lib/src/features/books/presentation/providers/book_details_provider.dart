import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/domain/models/book_details.dart';
import 'package:management_side/src/features/books/domain/repositories/book_repository.dart';
import 'package:management_side/src/features/books/presentation/providers/book_list_providers.dart';

final bookDetailsProvider = StateNotifierProvider.autoDispose
    .family<BookDetailsNotifier, AsyncValue<BookDetails>, int>(
      (ref, bookId) =>
          BookDetailsNotifier(ref.watch(bookRepositoryProvider), bookId),
    );

class BookDetailsNotifier extends StateNotifier<AsyncValue<BookDetails>> {
  final BookRepository _repository;
  final int bookId;

  BookDetailsNotifier(this._repository, this.bookId)
    : super(const AsyncValue.loading()) {
    _loadBookDetails();
  }

  Future<void> _loadBookDetails() async {
    state = const AsyncValue.loading();
    final result = await _repository.getBookDetails(bookId);

    state = result.when(
      success: (bookDetails) => AsyncValue.data(bookDetails),
      failure: (error, stackTrace) => AsyncValue.error(error, stackTrace!),
    );
  }

  Future<void> refresh() async {
    await _loadBookDetails();
  }

  // Add methods for actions like borrow, return, etc.
  // Future<Result<BookDetails>> borrowBook({
  //   required String userId,
  //   required DateTime dueDate,
  // }) async {
  //   final result = await _repository.borrowBook(
  //     bookId: bookId.toString(),
  //     userId: userId,
  //     dueDate: dueDate,
  //   );

  //   if (result.isSuccess) {
  //     await _loadBookDetails();
  //   }

  //   return result.when((book) => state.value!);
  // }
}
