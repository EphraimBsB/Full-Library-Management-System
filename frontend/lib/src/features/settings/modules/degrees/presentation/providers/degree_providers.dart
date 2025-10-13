import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/degrees/data/api/degree_api_service.dart';
import 'package:management_side/src/features/settings/modules/degrees/data/repositories/degree_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/degrees/domain/models/degree_model.dart';
import 'package:management_side/src/features/settings/modules/degrees/domain/repositories/degree_repository.dart';

// Repository Provider
final degreeRepositoryProvider = Provider<DegreeRepository>((ref) {
  final apiClient = ApiClient();
  final apiService = DegreeApiService(apiClient.dio);
  return DegreeRepositoryImpl(apiService);
});

// State Notifier
class DegreesNotifier extends StateNotifier<AsyncValue<List<Degree>>> {
  final DegreeRepository _repository;

  DegreesNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadDegrees();
  }

  Future<void> loadDegrees() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getDegrees(
        page: 1,
        limit: 100, // Load all Degrees
      );
      state = result.fold(
        (failure) => AsyncValue.error(failure, StackTrace.current),
        (Degrees) => AsyncValue.data(Degrees),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> refresh() => loadDegrees();

  Future<void> addDegree(Degree Degree) async {
    final result = await _repository.createDegree(Degree);
    await result.fold((failure) => throw failure, (_) => loadDegrees());
  }

  Future<void> updateDegree(Degree Degree) async {
    final result = await _repository.updateDegree(Degree);
    await result.fold((failure) => throw failure, (_) => loadDegrees());
  }

  Future<void> deleteDegree(int id) async {
    final result = await _repository.deleteDegree(id);
    await result.fold((failure) => throw failure, (_) => loadDegrees());
  }

  Future<void> toggleDegreeStatus(int id, bool isActive) async {
    final result = await _repository.toggleDegreeStatus(id, isActive);
    await result.fold((failure) => throw failure, (_) => loadDegrees());
  }
}

// State Notifier Provider
final degreesNotifierProvider =
    StateNotifierProvider<DegreesNotifier, AsyncValue<List<Degree>>>((ref) {
      final repository = ref.watch(degreeRepositoryProvider);
      return DegreesNotifier(repository);
    });
