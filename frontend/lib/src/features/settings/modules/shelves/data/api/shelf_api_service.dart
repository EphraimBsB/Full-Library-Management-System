import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/settings/modules/shelves/domain/models/shelf_model.dart';
import 'package:retrofit/retrofit.dart';

part 'shelf_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class ShelfApiService {
  factory ShelfApiService(Dio dio, {String baseUrl}) = _ShelfApiService;

  @GET('/shelves')
  Future<List<Map<String, dynamic>>> getShelves({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('isActive') bool? isActive,
  });

  @GET('/shelves/{id}')
  Future<dynamic> getShelf(@Path('id') int id);

  @POST('/shelves')
  Future<Shelf> createShelf(@Body() Map<String, dynamic> shelf);

  @PATCH('/shelves/{id}')
  Future<Shelf> updateShelf(
    @Path('id') int id,
    @Body() Map<String, dynamic> shelf,
  );

  @DELETE('/shelves/{id}')
  Future<void> deleteShelf(@Path('id') int id);

  @PATCH('/shelves/{id}/status')
  Future<Shelf> toggleShelfStatus(@Path('id') int id);
}
