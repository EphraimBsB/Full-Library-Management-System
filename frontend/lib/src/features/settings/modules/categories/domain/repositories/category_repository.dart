import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/models/category_model.dart';

abstract class CategoryRepository {
  Future<Either<Failure, List<Category>>> getCategories({
    int page,
    int limit,
    String? search,
    bool? isActive,
  });

  Future<Either<Failure, Category>> getCategory(int id);
  
  Future<Either<Failure, Category>> createCategory(Category category);
  
  Future<Either<Failure, Category>> updateCategory(Category category);
  
  Future<Either<Failure, void>> deleteCategory(int id);
  
  Future<Either<Failure, void>> toggleCategoryStatus(int id, bool isActive);
}
