import 'package:dio/dio.dart';
import '../../domain/models/category_model.dart';
import '../../domain/repositories/category_repository.dart';

class CategoryRepositoryImpl implements CategoryRepository {
  final Dio _dio;
  CategoryRepositoryImpl({Dio? dio}) : _dio = dio ?? Dio();

  @override
  Future<List<CategoryModel>> getCategories() async {
    final response = await _dio.get('http://your-api-url/categories');
    final data = response.data as List;
    return data.map((json) => CategoryModel.fromJson(json)).toList();
  }
}
