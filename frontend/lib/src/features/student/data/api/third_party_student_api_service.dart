import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';

part 'third_party_student_api_service.g.dart';

@RestApi(baseUrl: 'https://ilimsapi.isbatuniversity.ac.ug:9093/api')
abstract class ThirdPartyStudentApiService {
  factory ThirdPartyStudentApiService(Dio dio, {String baseUrl}) =
      _ThirdPartyStudentApiService;

  @GET('/StudentDetails')
  Future<Map<String, dynamic>> getStudentDetails(
    @Query('rollno') String rollNumber,
  );
}
