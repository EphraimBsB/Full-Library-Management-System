import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/models/source_model.dart';
import 'package:retrofit/retrofit.dart';

part 'source_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class SourceApiService {
  factory SourceApiService(Dio dio, {String baseUrl}) = _SourceApiService;

  @GET('/sources')
  Future<List<Map<String, dynamic>>> getSources({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('isActive') bool? isActive,
  });

  @GET('/sources/{id}')
  Future<dynamic> getSource(@Path('id') int id);

  @POST('/sources')
  Future<Map<String, dynamic>> createSource(
    @Body() Map<String, dynamic> source,
  );

  @PUT('/sources/{id}')
  Future<Map<String, dynamic>> updateSource(
    @Path('id') int id,
    @Body() Map<String, dynamic> source,
  );

  @DELETE('/sources/{id}')
  Future<void> deleteSource(@Path('id') int id);

  @PATCH('/sources/{id}/status')
  Future<void> toggleSourceStatus(
    @Path('id') int id,
    @Body() Map<String, dynamic> status,
  );
}
