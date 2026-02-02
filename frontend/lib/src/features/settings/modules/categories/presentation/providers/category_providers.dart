import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/categories/data/api/category_api_service.dart';
import 'package:management_side/src/features/settings/modules/categories/data/repositories/category_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/models/category_model.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/repositories/category_repository.dart';
import 'package:management_side/src/features/settings/presentation/utils/system_config_cache_invalidation.dart';

// Repository Provider
final categoryRepositoryProvider = Provider<CategoryRepository>((ref) {
  final apiClient = ApiClient();
  final apiService = CategoryApiService(apiClient.dio);
  return CategoryRepositoryImpl(apiService);
});

// State Notifier
class CategoriesNotifier extends StateNotifier<AsyncValue<List<Category>>> {
  final CategoryRepository _repository;

  CategoriesNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadCategories();
  }

  Future<void> loadCategories() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getCategories(
        page: 1,
        limit: 100, // Load all categories
      );
      state = result.fold(
        (failure) => AsyncValue.error(failure, StackTrace.current),
        (categories) => AsyncValue.data(categories),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> refresh() => loadCategories();

  Future<void> addCategory(Category category) async {
    final result = await _repository.createCategory(category);
    await result.fold((failure) => throw failure, (createdCategory) async {
      // Invalidate caches after successful creation
      await SystemConfigCacheInvalidator.invalidateCategoriesCaches(
        categoryId: createdCategory.id,
      );
      await loadCategories();
    });
  }

  Future<void> updateCategory(Category category) async {
    final result = await _repository.updateCategory(category);
    await result.fold((failure) => throw failure, (updatedCategory) async {
      // Invalidate caches after successful update
      await SystemConfigCacheInvalidator.invalidateCategoriesCaches(
        categoryId: category.id,
      );
      await loadCategories();
    });
  }

  Future<void> deleteCategory(int id) async {
    final result = await _repository.deleteCategory(id);
    await result.fold((failure) => throw failure, (_) async {
      // Invalidate caches after successful deletion
      await SystemConfigCacheInvalidator.invalidateCategoriesCaches(
        categoryId: id,
      );
      await loadCategories();
    });
  }

  Future<void> toggleCategoryStatus(int id, bool isActive) async {
    final result = await _repository.toggleCategoryStatus(id, isActive);
    await result.fold((failure) => throw failure, (_) async {
      // Invalidate caches after successful status toggle
      await SystemConfigCacheInvalidator.invalidateCategoriesCaches(
        categoryId: id,
      );
      await loadCategories();
    });
  }
}

// State Notifier Provider
final categoriesNotifierProvider =
    StateNotifierProvider<CategoriesNotifier, AsyncValue<List<Category>>>((
      ref,
    ) {
      final repository = ref.watch(categoryRepositoryProvider);
      return CategoriesNotifier(repository);
    });
