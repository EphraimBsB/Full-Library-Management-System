import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/categories/data/api/category_api_service.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/models/category_model.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/repositories/category_repository.dart';

class CategoryRepositoryImpl implements CategoryRepository {
  final CategoryApiService _apiService;

  CategoryRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, List<Category>>> getCategories({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  }) async {
    try {
      final response = await _apiService.getCategories(
        page: page,
        limit: limit,
        search: search,
        isActive: isActive,
      );

      final categories = (response as List<dynamic>)
          .map((e) => Category.fromJson(e as Map<String, dynamic>))
          .toList();

      return Right(categories);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Category>> getCategory(int id) async {
    try {
      final response = await _apiService.getCategory(id);

      if (response == null) {
        return Left(ServerFailure('Category not found'));
      }

      final category = Category.fromJson(response as Map<String, dynamic>);
      return Right(category);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to load category: $e'));
    }
  }

  @override
  Future<Either<Failure, Category>> createCategory(Category category) async {
    try {
      final response = await _apiService.createCategory(category.toJson());
      return Right(Category.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Category>> updateCategory(Category category) async {
    try {
      final response = await _apiService.updateCategory(
        category.id!,
        category.toJson(),
      );
      return Right(Category.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteCategory(int id) async {
    try {
      await _apiService.deleteCategory(id);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> toggleCategoryStatus(
    int id,
    bool isActive,
  ) async {
    try {
      await _apiService.toggleCategoryStatus(id, {'isActive': isActive});
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
