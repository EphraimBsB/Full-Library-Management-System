import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:retrofit/retrofit.dart';

part 'book_subject_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class SubjectApiService {
  factory SubjectApiService(Dio dio, {String baseUrl}) = _SubjectApiService;

  @GET('/subjects')
  Future<List<Map<String, dynamic>>> getSubjects({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('isActive') bool? isActive,
  });

  @GET('/subjects/{id}')
  Future<dynamic> getSubject(@Path('id') int id);

  @POST('/subjects')
  Future<Map<String, dynamic>> createSubject(
    @Body() Map<String, dynamic> subject,
  );

  @PUT('/subjects/{id}')
  Future<Map<String, dynamic>> updateSubject(
    @Path('id') int id,
    @Body() Map<String, dynamic> subject,
  );

  @DELETE('/subjects/{id}')
  Future<void> deleteSubject(@Path('id') int id);

  @PATCH('/subjects/{id}/status')
  Future<void> toggleSubjectStatus(
    @Path('id') int id,
    @Body() Map<String, dynamic> status,
  );
}
