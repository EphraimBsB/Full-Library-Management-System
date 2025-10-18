import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/settings/modules/degrees/domain/models/degree_model.dart';
import 'package:retrofit/retrofit.dart';

part 'degree_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class DegreeApiService {
  factory DegreeApiService(Dio dio, {String baseUrl}) = _DegreeApiService;

  @GET('/degrees')
  Future<List<Map<String, dynamic>>> getDegrees({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('isActive') bool? isActive,
  });

  @GET('/degrees/{id}')
  Future<dynamic> getDegree(@Path('id') int id);

  @POST('/degrees')
  Future<Map<String, dynamic>> createDegree(
    @Body() Map<String, dynamic> degree,
  );

  @PUT('/degrees/{id}')
  Future<Map<String, dynamic>> updateDegree(
    @Path('id') int id,
    @Body() Map<String, dynamic> degree,
  );

  @DELETE('/Degrees/{id}')
  Future<void> deleteDegree(@Path('id') int id);

  @PATCH('/Degrees/{id}/status')
  Future<void> toggleDegreeStatus(
    @Path('id') int id,
    @Body() Map<String, dynamic> status,
  );
}
