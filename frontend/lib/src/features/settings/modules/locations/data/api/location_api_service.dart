import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/settings/modules/locations/domain/models/location_model.dart';
import 'package:retrofit/retrofit.dart';

part 'location_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class LocationApiService {
  factory LocationApiService(Dio dio, {String baseUrl}) = _LocationApiService;

  @GET('/locations')
  Future<List<Map<String, dynamic>>> getLocations({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('isActive') bool? isActive,
  });

  @GET('/locations/{id}')
  Future<dynamic> getLocation(@Path('id') int id);

  @POST('/locations')
  Future<Location> createLocation(@Body() Map<String, dynamic> location);

  @PATCH('/locations/{id}')
  Future<Location> updateLocation(
    @Path('id') int id,
    @Body() Map<String, dynamic> location,
  );

  @DELETE('/locations/{id}')
  Future<void> deleteLocation(@Path('id') int id);

  @PATCH('/locations/{id}/status')
  Future<Location> toggleLocationStatus(@Path('id') int id);
}
