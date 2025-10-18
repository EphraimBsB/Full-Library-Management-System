import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/settings/modules/membership-types/domain/models/membership_type_model.dart';
import 'package:retrofit/retrofit.dart';

part 'membership_type_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class MembershipTypeApiService {
  factory MembershipTypeApiService(Dio dio, {String baseUrl}) =
      _MembershipTypeApiService;

  @GET('/membership-types')
  Future<List<Map<String, dynamic>>> getMembershipTypes({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('isActive') bool? isActive,
  });

  @GET('/membership-types/{id}')
  Future<dynamic> getMembershipType(@Path('id') int id);

  @POST('/membership-types')
  Future<Map<String, dynamic>> createMembershipType(
    @Body() Map<String, dynamic> membershipType,
  );

  @PUT('/membership-types/{id}')
  Future<Map<String, dynamic>> updateMembershipType(
    @Path('id') int id,
    @Body() Map<String, dynamic> membershipType,
  );

  @DELETE('/membership-types/{id}')
  Future<void> deleteMembershipType(@Path('id') int id);

  @PATCH('/membership-types/{id}/status')
  Future<void> toggleMembershipTypeStatus(
    @Path('id') int id,
    @Body() Map<String, dynamic> status,
  );
}
