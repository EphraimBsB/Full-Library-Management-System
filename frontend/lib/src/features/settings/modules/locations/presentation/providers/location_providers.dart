import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/locations/data/api/location_api_service.dart';
import 'package:management_side/src/features/settings/modules/locations/data/repositories/location_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/locations/domain/models/location_model.dart';
import 'package:management_side/src/features/settings/modules/locations/domain/repositories/location_repository.dart';

final locationRepositoryProvider = Provider<LocationRepository>((ref) {
  final apiClient = ApiClient();
  final apiService = LocationApiService(apiClient.dio);
  return LocationRepositoryImpl(apiService);
});

class LocationsNotifier extends StateNotifier<AsyncValue<List<Location>>> {
  final LocationRepository _repository;

  LocationsNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadLocations();
  }

  Future<void> loadLocations() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getLocations(page: 1, limit: 200);
      state = result.fold(
        (failure) => AsyncValue.error(failure, StackTrace.current),
        (locations) => AsyncValue.data(locations),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> addLocation(Location location) async {
    final result = await _repository.createLocation(location);
    await result.fold((failure) => throw failure, (_) => loadLocations());
  }

  Future<void> updateLocation(Location location) async {
    final result = await _repository.updateLocation(location);
    await result.fold((failure) => throw failure, (_) => loadLocations());
  }

  Future<void> deleteLocation(int id) async {
    final result = await _repository.deleteLocation(id);
    await result.fold((failure) => throw failure, (_) => loadLocations());
  }

  Future<void> toggleLocationStatus(int id) async {
    final result = await _repository.toggleLocationStatus(id);
    await result.fold((failure) => throw failure, (_) => loadLocations());
  }
}

final locationsNotifierProvider =
    StateNotifierProvider<LocationsNotifier, AsyncValue<List<Location>>>((ref) {
      final repository = ref.watch(locationRepositoryProvider);
      return LocationsNotifier(repository);
    });
