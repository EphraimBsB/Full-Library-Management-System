import 'package:dio/dio.dart';
import 'package:management_side/src/features/membership/domain/models/membership_request_model.dart';
import 'package:management_side/src/features/membership/domain/models/membership_request_model.dart';
import 'package:retrofit/retrofit.dart';
import 'package:management_side/src/core/network/api_constants.dart';

part 'membership_api_service.g.dart';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final int? count;

  ApiResponse({required this.success, this.data, this.message, this.count});

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic) fromJsonT,
  ) {
    return ApiResponse<T>(
      success: json['success'] as bool,
      data: json['data'] != null ? fromJsonT(json['data']) : null,
      message: json['message'] != null ? json['message'] as String : null,
      count: json['count'] != null ? json['count'] as int : null,
    );
  }
}

class MembershipRequestResponse {
  final List<Map<String, dynamic>> requests;
  final int? count;

  MembershipRequestResponse({required this.requests, this.count});

  factory MembershipRequestResponse.fromJson(Map<String, dynamic> json) {
    return MembershipRequestResponse(
      requests: List<Map<String, dynamic>>.from(
        json['data'].map((x) => x as Map<String, dynamic>),
      ),
      count: json['count'] != null ? json['count'] as int : null,
    );
  }
}

@RestApi(baseUrl: '')
abstract class MembershipApiService {
  factory MembershipApiService(Dio dio, {String? baseUrl}) {
    return _MembershipApiService(dio, baseUrl: baseUrl ?? ApiConstants.baseUrl);
  }

  /// Get all membership requests with optional filtering
  @GET('/membership-requests')
  @DioResponseType(ResponseType.json)
  Future<ApiResponse<List<Map<String, dynamic>>>> getMembershipRequests({
    @Query('status') String? status,
    @Query('page') int? page,
    @Query('limit') int? limit,
  });

  /// Get a specific membership request by ID
  @GET('/membership-requests/{id}')
  @DioResponseType(ResponseType.json)
  Future<ApiResponse<Map<String, dynamic>>> getMembershipRequest(
    @Path('id') String id,
  );

  /// Create a new membership request
  @POST('/membership-requests')
  @DioResponseType(ResponseType.json)
  Future<ApiResponse<Map<String, dynamic>>> createMembershipRequest(
    @Body() Map<String, dynamic> requestData,
  );

  /// Update a membership request
  @PATCH('/membership-requests/{id}')
  @DioResponseType(ResponseType.json)
  Future<ApiResponse<Map<String, dynamic>>> updateMembershipRequest(
    @Path('id') String id,
    @Body() Map<String, dynamic> updates,
  );

  /// Delete a membership request
  @DELETE('/membership-requests/{id}')
  @DioResponseType(ResponseType.json)
  Future<ApiResponse<void>> deleteMembershipRequest(@Path('id') String id);

  /// Approve a membership request
  @PUT('/membership-requests/{id}/approve')
  @DioResponseType(ResponseType.json)
  Future<ApiResponse<Map<String, dynamic>>> approveMembershipRequest(
    @Path('id') String id,
    @Body() Map<String, dynamic>? data,
  );

  /// Reject a membership request
  @PUT('/membership-requests/{id}/reject')
  @DioResponseType(ResponseType.json)
  Future<ApiResponse<Map<String, dynamic>>> rejectMembershipRequest(
    @Path('id') String id,
    @Body() Map<String, dynamic> data,
  );
}
