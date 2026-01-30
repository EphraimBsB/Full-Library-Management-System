import 'package:dio/dio.dart';
import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/core/utils/result.dart';
import 'package:management_side/src/features/books/data/api/book_api_service.dart';
import 'package:management_side/src/features/books/domain/models/book_copy.dart';
import 'package:management_side/src/features/books/domain/models/book_copy_response.dart';
import 'package:management_side/src/features/books/domain/models/book_details.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/models/inhouse_usage_model.dart';
import 'package:management_side/src/features/books/domain/repositories/book_repository.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';
import 'package:management_side/src/core/services/cache_service.dart';

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
    String? type,
    int? minAvailable,
    String? sortBy,
    String? sortOrder,
  }) {
    return handleApiCall<PaginatedResponse<BookModel>>(
      () => _apiService.getBooks(
        page: page,
        limit: limit,
        search: search,
        category: category,
        type: type,
        minAvailable: minAvailable,
        sortBy: sortBy,
        sortOrder: sortOrder,
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
      // Invalidate cache after successful creation
      await CacheService().invalidateBookCaches();
      return response;
    }, errorMessage: 'Failed to create book');
  }

  @override
  Future<Result<BookModel>> updateBook(BookModel book, int id) {
    return handleApiCall<BookModel>(() async {
      final bookJson = book.toCreateJson();
      bookJson.forEach((key, value) {
        print('  $key: $value (${value?.runtimeType})');
      });

      try {
        final response = await _apiService.updateBook(id, bookJson);
        // Invalidate cache after successful update
        await CacheService().invalidateBookCaches(bookId: id);
        return response;
      } on DioException catch (e) {
        rethrow;
      } catch (e) {
        print('=== UNEXPECTED ERROR ===');
        print('Error: $e');
        rethrow;
      }
    }, errorMessage: 'Failed to update book');
  }

  @override
  Future<Result<BookCopy>> updateBookCopy(
    int bookId,
    int copyId,
    Map<String, dynamic> copyData,
  ) {
    return handleApiCall<BookCopy>(() async {
      print('Updating book copy $copyId for book $bookId with data:');
      copyData.forEach((key, value) {
        print('  $key: $value (${value?.runtimeType})');
      });

      try {
        final response = await _apiService.updateBookCopy(
          bookId,
          copyId,
          copyData,
        );

        // Extract the BookCopy from the response
        if (response.success && response.data != null) {
          // Invalidate cache after successful update
          await CacheService().invalidateBookCaches(bookId: bookId);
          return response.data!;
        } else {
          throw Exception(response.message);
        }
      } on DioException catch (e) {
        rethrow;
      } catch (e) {
        print('=== UNEXPECTED ERROR ===');
        print('Error: $e');
        rethrow;
      }
    }, errorMessage: 'Failed to update book copy');
  }

  @override
  Future<Result<void>> deleteBook(int id) {
    return handleApiCall(() async {
      await _apiService.deleteBook(id);
      // Invalidate cache after successful deletion
      await CacheService().invalidateBookCaches(bookId: id);
    }, errorMessage: 'Failed to delete book');
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

  @override
  Future<Result<InhouseUsageListResponse>> getHistoryInhouseUsages({
    InhouseUsageStatus? status,
  }) {
    return handleApiCall<InhouseUsageListResponse>(
      () => _apiService.getHistoryInhouseUsages(status: status?.name),
      errorMessage: 'Failed to load history in-house usages',
    );
  }

  @override
  Future<Result<Map<String, dynamic>>> startInhouseUsage(
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await _apiService.startInhouseUsage(data);
      return Success(response);
    } on DioException catch (e) {
      return Failure(e, e.stackTrace);
    } catch (e, stackTrace) {
      return Failure(e, stackTrace);
    }
  }

  @override
  Future<Result<Map<String, dynamic>>> endInhouseUsage(String id) {
    return handleApiCall<Map<String, dynamic>>(
      () => _apiService.endInhouseUsage(id),
      errorMessage: 'Failed to end in-house usage',
    );
  }

  @override
  Future<Result<Map<String, dynamic>>> forceEndInhouseUsage(String id) {
    return handleApiCall<Map<String, dynamic>>(
      () => _apiService.forceEndInhouseUsage(id),
      errorMessage: 'Failed to force end in-house usage',
    );
  }

  @override
  Future<Result<Map<String, int>>> getInhouseUsageCounts() {
    return handleApiCall<Map<String, int>>(
      () => _apiService.getInhouseUsageCounts(),
      errorMessage: 'Failed to load in-house usage counts',
    );
  }
}
