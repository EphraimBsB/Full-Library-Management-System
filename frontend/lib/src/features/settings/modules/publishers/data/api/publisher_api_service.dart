import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/settings/modules/publishers/domain/models/publisher_model.dart';
import 'package:retrofit/retrofit.dart';

part 'publisher_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class PublisherApiService {
  factory PublisherApiService(Dio dio, {String baseUrl}) = _PublisherApiService;

  @GET('/publishers')
  Future<List<Map<String, dynamic>>> getPublishers({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('isActive') bool? isActive,
  });

  @GET('/publishers/{id}')
  Future<dynamic> getPublisher(@Path('id') int id);

  @POST('/publishers')
  Future<Publisher> createPublisher(@Body() Map<String, dynamic> publisher);

  @PATCH('/publishers/{id}')
  Future<Publisher> updatePublisher(
    @Path('id') int id,
    @Body() Map<String, dynamic> publisher,
  );

  @DELETE('/publishers/{id}')
  Future<void> deletePublisher(@Path('id') int id);

  @PATCH('/publishers/{id}/status')
  Future<Publisher> togglePublisherStatus(@Path('id') int id);
}
