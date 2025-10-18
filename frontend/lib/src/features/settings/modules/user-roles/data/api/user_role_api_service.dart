import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/settings/modules/user-roles/domain/models/user_role_model.dart';
import 'package:retrofit/retrofit.dart';

part 'user_role_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class UserRoleApiService {
  factory UserRoleApiService(Dio dio, {String baseUrl}) = _UserRoleApiService;

  @GET('/user-roles')
  Future<List<Map<String, dynamic>>> getUserRoles({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('isActive') bool? isActive,
  });

  @GET('/user-roles/{id}')
  Future<dynamic> getUserRole(@Path('id') int id);

  @POST('/user-roles')
  Future<Map<String, dynamic>> createUserRole(
    @Body() Map<String, dynamic> userRole,
  );

  @PUT('/user-roles/{id}')
  Future<Map<String, dynamic>> updateUserRole(
    @Path('id') int id,
    @Body() Map<String, dynamic> userRole,
  );

  @DELETE('/user-roles/{id}')
  Future<void> deleteUserRole(@Path('id') int id);

  @PATCH('/user-roles/{id}/status')
  Future<void> toggleUserRoleStatus(
    @Path('id') int id,
    @Body() Map<String, bool> status,
  );
}
