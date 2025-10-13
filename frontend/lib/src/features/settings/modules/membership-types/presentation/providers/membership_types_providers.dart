import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/membership-types/data/api/membership_type_api_service.dart';
import 'package:management_side/src/features/settings/modules/membership-types/data/repositories/membership_type_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/membership-types/domain/models/membership_type_model.dart';
import 'package:management_side/src/features/settings/modules/membership-types/domain/repositories/membership_type_repository.dart';

// Repository Provider
final membershipTypeRepositoryProvider = Provider<MembershipTypeRepository>((
  ref,
) {
  final apiClient = ApiClient();
  final apiService = MembershipTypeApiService(apiClient.dio);
  return MembershipTypeRepositoryImpl(apiService);
});

// State Notifier
class MembershipTypesNotifier
    extends StateNotifier<AsyncValue<List<MembershipType>>> {
  final MembershipTypeRepository _repository;

  MembershipTypesNotifier(this._repository)
    : super(const AsyncValue.loading()) {
    loadMembershipTypes();
  }

  Future<void> loadMembershipTypes() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getMembershipTypes();
      state = result.fold(
        (failure) => AsyncValue.error(failure, StackTrace.current),
        (membershipTypes) => AsyncValue.data(membershipTypes),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> refresh() => loadMembershipTypes();

  Future<void> addMembershipType(MembershipType membershipType) async {
    final result = await _repository.createMembershipType(membershipType);
    await result.fold((failure) => throw failure, (_) => loadMembershipTypes());
  }

  Future<void> updateMembershipType(MembershipType membershipType) async {
    final result = await _repository.updateMembershipType(membershipType);
    await result.fold((failure) => throw failure, (_) => loadMembershipTypes());
  }

  Future<void> deleteMembershipType(int id) async {
    final result = await _repository.deleteMembershipType(id);
    await result.fold((failure) => throw failure, (_) => loadMembershipTypes());
  }

  Future<void> toggleMembershipTypeStatus(int id, bool isActive) async {
    final result = await _repository.toggleMembershipTypeStatus(id, isActive);
    await result.fold((failure) => throw failure, (_) => loadMembershipTypes());
  }
}

// State Notifier Provider
final membershipTypesNotifierProvider =
    StateNotifierProvider<
      MembershipTypesNotifier,
      AsyncValue<List<MembershipType>>
    >((ref) {
      final repository = ref.watch(membershipTypeRepositoryProvider);
      return MembershipTypesNotifier(repository);
    });
