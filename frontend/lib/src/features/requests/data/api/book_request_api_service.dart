import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/requests/domain/models/book_request_model.dart';

part 'book_request_api_service.g.dart';

/// API service for book request related operations
@RestApi(baseUrl: '')
abstract class BookRequestApiService {
  factory BookRequestApiService(Dio dio, {String? baseUrl}) {
    return _BookRequestApiService(
      dio,
      baseUrl: baseUrl ?? ApiConstants.baseUrl,
    );
  }

  /// Create a new book request
  @POST('/book-requests')
  @DioResponseType(ResponseType.json)
  Future<BookRequest> createBookRequest(
    @Body() Map<String, dynamic> requestBody,
  );

  // Get all pending book requests
  @GET('/book-requests?status=PENDING')
  @DioResponseType(ResponseType.json)
  Future<List<BookRequest>> getPendingBookRequests();

  // Approve a book request
  @POST('/book-requests/{requestId}/approve')
  @DioResponseType(ResponseType.json)
  Future<Map<String, dynamic>> approveBookRequest(
    @Path('requestId') String requestId,
    @Body() Map<String, dynamic> requestBody,
  );

  /// Reject a book request
  @POST('/book-requests/{requestId}/reject')
  @DioResponseType(ResponseType.json)
  Future<void> rejectBookRequest(
    @Path('requestId') String requestId,
    @Body() Map<String, dynamic> requestBody,
  );
}
