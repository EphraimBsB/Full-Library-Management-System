import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/publishers/data/api/publisher_api_service.dart';
import 'package:management_side/src/features/settings/modules/publishers/data/repositories/publisher_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/publishers/domain/models/publisher_model.dart';
import 'package:management_side/src/features/settings/modules/publishers/domain/repositories/publisher_repository.dart';

final publisherRepositoryProvider = Provider<PublisherRepository>((ref) {
  final apiClient = ApiClient();
  final apiService = PublisherApiService(apiClient.dio);
  return PublisherRepositoryImpl(apiService);
});

class PublishersNotifier extends StateNotifier<AsyncValue<List<Publisher>>> {
  final PublisherRepository _repository;

  PublishersNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadPublishers();
  }

  Future<void> loadPublishers() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getPublishers(page: 1, limit: 200);
      state = result.fold(
        (failure) => AsyncValue.error(failure, StackTrace.current),
        (publishers) => AsyncValue.data(publishers),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> addPublisher(Publisher publisher) async {
    final result = await _repository.createPublisher(publisher);
    await result.fold((failure) => throw failure, (_) => loadPublishers());
  }

  Future<void> updatePublisher(Publisher publisher) async {
    final result = await _repository.updatePublisher(publisher);
    await result.fold((failure) => throw failure, (_) => loadPublishers());
  }

  Future<void> deletePublisher(int id) async {
    final result = await _repository.deletePublisher(id);
    await result.fold((failure) => throw failure, (_) => loadPublishers());
  }

  Future<void> togglePublisherStatus(int id) async {
    final result = await _repository.togglePublisherStatus(id);
    await result.fold((failure) => throw failure, (_) => loadPublishers());
  }
}

final publishersNotifierProvider =
    StateNotifierProvider<PublishersNotifier, AsyncValue<List<Publisher>>>((
      ref,
    ) {
      final repository = ref.watch(publisherRepositoryProvider);
      return PublishersNotifier(repository);
    });
