import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/book_sources/data/api/source_api_service.dart';
import 'package:management_side/src/features/settings/modules/book_sources/data/repositories/source_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/models/source_model.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/repositories/source_repository.dart';

// Repository Provider
final sourceRepositoryProvider = Provider<SourceRepository>((ref) {
  final apiClient = ApiClient();
  final apiService = SourceApiService(apiClient.dio);
  return SourceRepositoryImpl(apiService);
});

// State Notifier
class SourcesNotifier extends StateNotifier<AsyncValue<List<Source>>> {
  final SourceRepository _repository;

  SourcesNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadSources();
  }

  Future<void> loadSources() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getSources(
        page: 1,
        limit: 100, // Load all Sources
      );
      state = result.fold(
        (failure) => AsyncValue.error(failure, StackTrace.current),
        (sources) => AsyncValue.data(sources),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> refresh() => loadSources();

  Future<void> addSource(Source source) async {
    final result = await _repository.createSource(source);
    await result.fold((failure) => throw failure, (_) => loadSources());
  }

  Future<void> updateSource(Source source) async {
    final result = await _repository.updateSource(source);
    await result.fold((failure) => throw failure, (_) => loadSources());
  }

  Future<void> deleteSource(int id) async {
    final result = await _repository.deleteSource(id);
    await result.fold((failure) => throw failure, (_) => loadSources());
  }

  Future<void> toggleSourceStatus(int id, bool isActive) async {
    final result = await _repository.toggleSourceStatus(id, isActive);
    await result.fold((failure) => throw failure, (_) => loadSources());
  }
}

// State Notifier Provider
final sourcesNotifierProvider =
    StateNotifierProvider<SourcesNotifier, AsyncValue<List<Source>>>((ref) {
      final repository = ref.watch(sourceRepositoryProvider);
      return SourcesNotifier(repository);
    });
