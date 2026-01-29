import 'package:retrofit/retrofit.dart';
import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';

part 'loan_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class LoanApiService {
  factory LoanApiService(Dio dio, {String baseUrl}) = _LoanApiService;

  @POST('/loans')
  Future<dynamic> createLoan(@Body() Map<String, dynamic> loanData);

  @POST('/loans/issue-to-user')
  Future<dynamic> issueBookToUser(@Body() Map<String, dynamic> issueData);
}
