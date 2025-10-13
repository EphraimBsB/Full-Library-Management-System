import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';

part 'loan_api_service.g.dart';

/// API service for loan related operations
@RestApi(baseUrl: '')
abstract class LoanApiService {
  factory LoanApiService(Dio dio, {String? baseUrl}) {
    return _LoanApiService(dio, baseUrl: baseUrl ?? ApiConstants.baseUrl);
  }

  /// Get all loans with optional query parameters
  @GET('/loans')
  @DioResponseType(ResponseType.json)
  Future<List<Loan>> getLoans({
    @Query('status') String? status,
    @Query('userId') String? userId,
    @Query('bookId') String? bookId,
    @Query('overdueOnly') bool? overdueOnly,
    @Query('page') int? page,
    @Query('limit') int? limit,
  });

  /// Get a single loan by ID
  @GET('/loans/{id}')
  @DioResponseType(ResponseType.json)
  Future<Loan> getLoanById(@Path('id') String id);

  /// Create a new loan
  @POST('/loans')
  @DioResponseType(ResponseType.json)
  Future<Loan> createLoan(@Body() Map<String, dynamic> loanData);

  /// Update a loan
  @PUT('/loans/{id}')
  @DioResponseType(ResponseType.json)
  Future<Loan> updateLoan(
    @Path('id') String id,
    @Body() Map<String, dynamic> updates,
  );

  /// Delete a loan
  @DELETE('/loans/{id}')
  @DioResponseType(ResponseType.json)
  Future<void> deleteLoan(@Path('id') String id);

  /// Return a borrowed book
  @POST('/loans/{id}/return')
  @DioResponseType(ResponseType.json)
  Future<Loan> returnBook(
    @Path('id') String id,
    @Body() Map<String, dynamic> returnData,
  );

  /// Renew a loan
  @POST('/loans/{id}/renew')
  @DioResponseType(ResponseType.json)
  Future<Loan> renewLoan(
    @Path('id') String id,
    @Body() Map<String, dynamic> renewalData,
  );

  /// Get overdue loans
  @GET('/loans/overdue')
  @DioResponseType(ResponseType.json)
  Future<List<Loan>> getOverdueLoans({
    @Query('page') int? page,
    @Query('limit') int? limit,
  });

  /// Get loans by user ID
  @GET('/users/{userId}/loans')
  @DioResponseType(ResponseType.json)
  Future<List<Loan>> getUserLoans(
    @Path('userId') String userId, {
    @Query('status') String? status,
    @Query('page') int? page,
    @Query('limit') int? limit,
  });
}
