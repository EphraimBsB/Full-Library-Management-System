import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/shelves/data/api/shelf_api_service.dart';
import 'package:management_side/src/features/settings/modules/shelves/data/repositories/shelf_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/shelves/domain/models/shelf_model.dart';
import 'package:management_side/src/features/settings/modules/shelves/domain/repositories/shelf_repository.dart';

final shelfRepositoryProvider = Provider<ShelfRepository>((ref) {
  final apiClient = ApiClient();
  final apiService = ShelfApiService(apiClient.dio);
  return ShelfRepositoryImpl(apiService);
});

class ShelvesNotifier extends StateNotifier<AsyncValue<List<Shelf>>> {
  final ShelfRepository _repository;

  ShelvesNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadShelves();
  }

  Future<void> loadShelves() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getShelves(page: 1, limit: 200);
      state = result.fold(
        (failure) => AsyncValue.error(failure, StackTrace.current),
        (shelves) => AsyncValue.data(shelves),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> addShelf(Shelf shelf) async {
    final result = await _repository.createShelf(shelf);
    await result.fold((failure) => throw failure, (_) => loadShelves());
  }

  Future<void> updateShelf(Shelf shelf) async {
    final result = await _repository.updateShelf(shelf);
    await result.fold((failure) => throw failure, (_) => loadShelves());
  }

  Future<void> deleteShelf(int id) async {
    final result = await _repository.deleteShelf(id);
    await result.fold((failure) => throw failure, (_) => loadShelves());
  }

  Future<void> toggleShelfStatus(int id) async {
    final result = await _repository.toggleShelfStatus(id);
    await result.fold((failure) => throw failure, (_) => loadShelves());
  }
}

final shelvesNotifierProvider =
    StateNotifierProvider<ShelvesNotifier, AsyncValue<List<Shelf>>>((ref) {
      final repository = ref.watch(shelfRepositoryProvider);
      return ShelvesNotifier(repository);
    });
