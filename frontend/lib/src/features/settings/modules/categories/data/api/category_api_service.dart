import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:retrofit/retrofit.dart';

part 'category_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class CategoryApiService {
  factory CategoryApiService(Dio dio, {String baseUrl}) = _CategoryApiService;

  @GET('/categories')
  Future<List<Map<String, dynamic>>> getCategories({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('isActive') bool? isActive,
  });

  @GET('/categories/{id}')
  Future<dynamic> getCategory(@Path('id') int id);

  @POST('/categories')
  Future<Map<String, dynamic>> createCategory(
    @Body() Map<String, dynamic> category,
  );

  @PUT('/categories/{id}')
  Future<Map<String, dynamic>> updateCategory(
    @Path('id') int id,
    @Body() Map<String, dynamic> category,
  );

  @DELETE('/categories/{id}')
  Future<void> deleteCategory(@Path('id') int id);

  @PATCH('/categories/{id}/status')
  Future<void> toggleCategoryStatus(
    @Path('id') int id,
    @Body() Map<String, dynamic> status,
  );
}
