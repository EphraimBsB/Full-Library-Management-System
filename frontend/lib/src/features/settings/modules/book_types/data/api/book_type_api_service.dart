import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:retrofit/retrofit.dart';

part 'book_type_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class BookTypeApiService {
  factory BookTypeApiService(Dio dio, {String baseUrl}) = _BookTypeApiService;

  @GET('/types')
  Future<List<Map<String, dynamic>>> getTypes({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('isActive') bool? isActive,
  });

  @GET('/types/{id}')
  Future<dynamic> getType(@Path('id') int id);

  @POST('/types')
  Future<Map<String, dynamic>> createType(@Body() Map<String, dynamic> type);

  @PUT('/types/{id}')
  Future<Map<String, dynamic>> updateType(
    @Path('id') int id,
    @Body() Map<String, dynamic> type,
  );

  @DELETE('/types/{id}')
  Future<void> deleteType(@Path('id') int id);

  @PATCH('/types/{id}/status')
  Future<void> toggleTypeStatus(
    @Path('id') int id,
    @Body() Map<String, dynamic> status,
  );
}
