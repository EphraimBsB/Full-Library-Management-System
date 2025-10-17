import 'package:dio/dio.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';
import 'package:retrofit/retrofit.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/student/domain/models/profile_summary_model.dart';

part 'student_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class StudentApiService {
  factory StudentApiService(Dio dio, {String baseUrl}) = _StudentApiService;

  @GET('/users/{userId}/profile-summary')
  Future<ProfileSummaryModel> getProfileSummary(@Path('userId') String userId);

  @GET('/users/{userId}/borrow-history')
  Future<BorrowHistoryResponse<Loan>> getBorrowHistory(
    @Path('userId') String userId, {
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
  });

  @GET('/users/{userId}/favorites')
  Future<BorrowHistoryResponse<BookModel>> getFavorites(
    @Path('userId') String userId, {
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
  });

  @GET('/users/{userId}/notes')
  Future<BorrowHistoryResponse<BookNote>> getUserNotes(
    @Path('userId') String userId, {
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
  });
}

class BorrowHistoryResponse<T> {
  final List<T> data;
  final int total;
  final String page;
  final String limit;
  final int totalPages;
  final bool hasPreviousPage;
  final bool hasNextPage;

  BorrowHistoryResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
    required this.hasPreviousPage,
    required this.hasNextPage,
  });

  factory BorrowHistoryResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return BorrowHistoryResponse<T>(
      data: (json['data'] as List)
          .map((item) => fromJsonT(item as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int,
      page: json['page'].toString(),
      limit: json['limit'].toString(),
      totalPages: json['totalPages'] as int,
      hasPreviousPage: json['hasPreviousPage'] as bool,
      hasNextPage: json['hasNextPage'] as bool,
    );
  }
}
