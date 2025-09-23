import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:management_side/src/features/books/domain/models/borrowed_book.dart';
import 'package:management_side/src/core/network/api_constants.dart';

part 'book_request_api_service.g.dart';

/// API service for book request related operations
@RestApi(baseUrl: '')
abstract class BookRequestApiService {
  factory BookRequestApiService(Dio dio, {String? baseUrl}) {
    // Use the base URL from ApiConstants
    return _BookRequestApiService(dio, baseUrl: ApiConstants.baseUrl);
  }

  /// Get the request queue for a specific book
  @GET('/book-requests/book/{bookId}/queue')
  @DioResponseType(ResponseType.json)
  Future<List<BorrowedBook>> getBookRequestQueue(@Path('bookId') String bookId);
}
