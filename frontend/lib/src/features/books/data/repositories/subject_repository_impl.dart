import 'package:dio/dio.dart';
import '../../domain/models/subject_model.dart';
import '../../domain/repositories/subject_repository.dart';

class SubjectRepositoryImpl implements SubjectRepository {
  final Dio _dio;
  SubjectRepositoryImpl({Dio? dio}) : _dio = dio ?? Dio();

  @override
  Future<List<SubjectModel>> getSubjects() async {
    final response = await _dio.get('http://your-api-url/subjects');
    final data = response.data as List;
    return data.map((json) => SubjectModel.fromJson(json)).toList();
  }
}
