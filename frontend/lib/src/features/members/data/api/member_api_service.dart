import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:retrofit/retrofit.dart';
import 'package:management_side/src/features/members/domain/models/membership_model.dart';

part 'member_api_service.g.dart';

@RestApi(baseUrl: '')
abstract class MemberApiService {
  factory MemberApiService(Dio dio, {String? baseUrl}) {
    return _MemberApiService(dio, baseUrl: baseUrl ?? ApiConstants.baseUrl);
  }

  /// Get all memberships with optional filtering
  @GET('/memberships')
  @DioResponseType(ResponseType.json)
  Future<List<Membership>> getMemberships({
    @Query('status') String? status,
    @Query('page') int? page,
    @Query('limit') int? limit,
  });

  /// Get a specific membership by ID
  @GET('/memberships/{id}')
  @DioResponseType(ResponseType.json)
  Future<Membership> getMembership(@Path('id') String id);

  /// Create a new membership
  @POST('/memberships')
  @DioResponseType(ResponseType.json)
  Future<Membership> createMembership(
    @Body() Map<String, dynamic> membershipData,
  );

  /// Update a membership
  @PATCH('/memberships/{id}')
  @DioResponseType(ResponseType.json)
  Future<Membership> updateMembership(
    @Path('id') String id,
    @Body() Map<String, dynamic> updates,
  );

  /// Delete a membership
  @DELETE('/memberships/{id}')
  @DioResponseType(ResponseType.json)
  Future<void> deleteMembership(@Path('id') String id);
}
