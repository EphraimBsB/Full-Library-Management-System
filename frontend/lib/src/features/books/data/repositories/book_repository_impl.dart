import 'package:dio/dio.dart';
import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/core/utils/result.dart';
import 'package:management_side/src/features/books/data/api/book_api_service.dart';
import 'package:management_side/src/features/books/domain/models/book_details.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/models/inhouse_usage_model.dart';
import 'package:management_side/src/features/books/domain/repositories/book_repository.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';

class BookRepositoryImpl extends BaseRepository implements BookRepository {
  late final BookApiService _apiService;

  BookRepositoryImpl({Dio? dio}) {
    final client = dio ?? ApiClient().dio;
    _apiService = BookApiService(client);
  }

  @override
  Future<Result<PaginatedResponse<BookModel>>> getBooks({
    int page = 1,
    int limit = 24,
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
  @override
  Future<Result<BookModel>> createBook(BookModel book) {
    return handleApiCall<BookModel>(() async {
      // Convert the Book object to JSON before sending
      final bookJson = book.toCreateJson();
      final response = await _apiService.createBook(bookJson);
      return response;
    }, errorMessage: 'Failed to create book');
  }

  @override
  Future<Result<BookModel>> updateBook(BookModel book, int id) {
    return handleApiCall<BookModel>(() async {
      final bookJson = book.toCreateJson();
      print('=== UPDATE BOOK REQUEST ===');
      print('Endpoint: PATCH /books/$id');
      print('Request Data:');
      bookJson.forEach((key, value) {
        print('  $key: $value (${value?.runtimeType})');
      });

      try {
        final response = await _apiService.updateBook(id, bookJson);
        return response;
      } on DioException catch (e) {
        print('Status: ${e.response?.statusCode}');
        print('Response: ${e.response?.data}');
        print('Headers: ${e.response?.headers}');
        rethrow;
      } catch (e) {
        print('=== UNEXPECTED ERROR ===');
        print('Error: $e');
        rethrow;
      }
    }, errorMessage: 'Failed to update book');
  }

  @override
  Future<Result<void>> deleteBook(int id) {
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

  @override
  Future<Result<BookDetails>> getBookDetails(int id) {
    return handleApiCall<BookDetails>(
      () => _apiService.getBookDetails(id),
      errorMessage: 'Failed to load book details',
    );
  }

  @override
  Future<Result<List<BookNote>>> getBookNotes(int bookId) {
    return handleApiCall<List<BookNote>>(
      () => _apiService.getBookNotes(bookId),
      errorMessage: 'Failed to load book notes',
    );
  }

  @override
  Future<Result<BookNote>> createBookNote(BookNote note) {
    return handleApiCall<BookNote>(
      () => _apiService.createBookNote(note.toJson()),
      errorMessage: 'Failed to create book note',
    );
  }

  @override
  Future<Result<void>> deleteBookNote(String id) {
    return handleApiCall(
      () => _apiService.deleteBookNote(id),
      errorMessage: 'Failed to delete book note',
    );
  }

  @override
  Future<Result<BookNote>> getBookNote(String id) {
    return handleApiCall<BookNote>(
      () => _apiService.getBookNote(id),
      errorMessage: 'Failed to load book note',
    );
  }

  @override
  Future<Result<BookNote>> updateBookNote(BookNote note, String id) {
    return handleApiCall<BookNote>(
      () => _apiService.updateBookNote(id, note.toJson()),
      errorMessage: 'Failed to update book note',
    );
  }

  @override
  Future<Result<InhouseUsageListResponse>> getAllInhouseUsages({
    InhouseUsageStatus? status,
  }) {
    return handleApiCall<InhouseUsageListResponse>(
      () => _apiService.getAllInhouseUsages(status: status?.name),
      errorMessage: 'Failed to load in-house usages',
    );
  }

  // @override
  // Future<Result<List<InhouseUsage>>> getActiveInhouseUsages() {
  //   return handleApiCall<List<InhouseUsage>>(
  //     () => _apiService.getActiveInhouseUsages(),
  //     errorMessage: 'Failed to load active in-house usages',
  //   );
  // }

  // @override
  // Future<Result<List<InhouseUsage>>> getHistoryInhouseUsages() {
  //   return handleApiCall<List<InhouseUsage>>(
  //     () => _apiService.getHistoryInhouseUsages(),
  //     errorMessage: 'Failed to load history in-house usages',
  //   );
  // }

  @override
  Future<Result<InhouseUsage>> startInhouseUsage(Map<String, dynamic> data) {
    print('=== START IN-HOUSE USAGE REQUEST ===');
    print('Endpoint: POST /books/inhouse-usage/start');
    print('Request Data: ${data.toString()}');
    return handleApiCall<InhouseUsage>(
      () => _apiService.startInhouseUsage(data),
      errorMessage: 'Failed to start in-house usage',
    );
  }

  @override
  Future<Result<InhouseUsage>> endInhouseUsage(String id) {
    return handleApiCall<InhouseUsage>(
      () => _apiService.endInhouseUsage(id),
      errorMessage: 'Failed to end in-house usage',
    );
  }

  @override
  Future<Result<InhouseUsage>> forceEndInhouseUsage(String id) {
    return handleApiCall<InhouseUsage>(
      () => _apiService.forceEndInhouseUsage(id),
      errorMessage: 'Failed to force end in-house usage',
    );
  }
}
