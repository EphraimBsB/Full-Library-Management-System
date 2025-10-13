import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/auth/domain/models/auth_response.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';

part 'auth_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class AuthApiService {
  factory AuthApiService(Dio dio, {String baseUrl}) = _AuthApiService;

  @POST('/auth/login')
  @FormUrlEncoded()
  Future<AuthResponse> login({
    @Field('email') required String email,
    @Field('password') required String password,
  });

  @POST('/auth/register')
  Future<AuthResponse> register({
    @Field('email') required String email,
    @Field('password') required String password,
    @Field('firstName') required String firstName,
    @Field('lastName') required String lastName,
    @Field('phoneNumber') String? phoneNumber,
    @Field('rollNumber') String? rollNumber,
  });

  @GET('/auth/me')
  Future<User> getCurrentUser();

  @POST('/auth/logout')
  Future<void> logout();

  @POST('/auth/refresh')
  Future<AuthResponse> refreshToken({
    @Field('refreshToken') required String refreshToken,
  });

  @POST('/auth/password/forgot')
  Future<void> forgotPassword({@Field('email') required String email});

  @POST('/auth/password/reset')
  Future<void> resetPassword({
    @Field('token') required String token,
    @Field('password') required String password,
  });
}
