import 'package:dio/dio.dart';
import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/core/utils/result.dart';
import 'package:management_side/src/features/books/data/api/book_api_service.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/repositories/book_repository.dart';

class BookRepositoryImpl extends BaseRepository implements BookRepository {
  late final BookApiService _apiService;

  BookRepositoryImpl({Dio? dio}) {
    final client = dio ?? ApiClient().dio;
    _apiService = BookApiService(client);
  }

  @override
  Future<Result<PaginatedResponse<BookModel>>> getBooks({
    int page = 1,
    int limit = 10,
    String? search,
    String? category,
    String? status,
    String? type,
    String? sort,
  }) {
    return handleApiCall<PaginatedResponse<BookModel>>(
      () => _apiService.getBooks(
        page: page,
        limit: limit,
        search: search,
        category: category,
        status: status,
        type: type,
        sort: sort,
      ),
      errorMessage: 'Failed to load books',
    );
  }

  @override
  Future<Result<BookModel>> getBook(String id) {
    return handleApiCall<BookModel>(
      () => _apiService.getBook(id),
      errorMessage: 'Failed to load book details',
    );
  }

  @override
  Future<Result<BookModel>> createBook(BookModel book) {
    return handleApiCall<BookModel>(() async {
      final response = await _apiService.createBook(book);
      return response;
    }, errorMessage: 'Failed to create book');
  }

  @override
  Future<Result<BookModel>> updateBook(BookModel book) {
    return handleApiCall<BookModel>(() async {
      final response = await _apiService.updateBook(book.id.toString(), book);
      return response;
    }, errorMessage: 'Failed to update book');
  }

  @override
  Future<Result<void>> deleteBook(String id) {
    return handleApiCall(
      () => _apiService.deleteBook(id),
      errorMessage: 'Failed to delete book',
    );
  }

  @override
  Future<Result<BookModel>> borrowBook({
    required String bookId,
    required String userId,
    required DateTime dueDate,
  }) {
    return handleApiCall<BookModel>(
      () => _apiService.borrowBook(bookId, {
        'user_id': userId,
        'due_date': dueDate.toIso8601String(),
      }),
      errorMessage: 'Failed to borrow book',
    );
  }

  @override
  Future<Result<BookModel>> returnBook({
    required String bookId,
    required String userId,
  }) {
    return handleApiCall<BookModel>(
      () => _apiService.returnBook(bookId, {'user_id': userId}),
      errorMessage: 'Failed to return book',
    );
  }
}
