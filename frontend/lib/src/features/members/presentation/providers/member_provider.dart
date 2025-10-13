import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/core/network/network_info.dart';
import 'package:management_side/src/features/members/data/api/member_api_service.dart';
import 'package:management_side/src/features/members/data/repositories/member_repository_impl.dart';
import 'package:management_side/src/features/members/domain/models/membership_model.dart';
import 'package:management_side/src/features/members/domain/repositories/member_repository.dart';

// API Service Provider
final dioProvider = Provider<Dio>((ref) => ApiClient().dio);

final memberApiServiceProvider = Provider<MemberApiService>((ref) {
  final dio = ref.watch(dioProvider);
  return MemberApiService(dio);
});

// Network Info Provider
final networkInfoProvider = Provider<NetworkInfo>((ref) {
  // In a real app, you would return a proper implementation of NetworkInfo
  // that checks for internet connectivity
  return _FakeNetworkInfo();
});

// Repository Provider
final memberRepositoryProvider = Provider<MemberRepository>((ref) {
  final apiService = ref.watch(memberApiServiceProvider);
  final networkInfo = ref.watch(networkInfoProvider);
  return MemberRepositoryImpl(apiService: apiService, networkInfo: networkInfo);
});

// Temporary fake NetworkInfo implementation for development
class _FakeNetworkInfo implements NetworkInfo {
  @override
  Future<bool> get isConnected async => true;
}

// State Notifier
class MemberNotifier extends StateNotifier<AsyncValue<List<Membership>>> {
  final MemberRepository _repository;

  MemberNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadMemberships();
  }

  Future<void> loadMemberships() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getMemberships();
      state = result.fold(
        (failure) => AsyncValue.error(failure, StackTrace.current),
        (memberships) => AsyncValue.data(memberships),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> refresh() => loadMemberships();

  Future<Membership> getMembership(String id) async {
    final result = await _repository.getMembership(id);
    return result.fold((failure) => throw failure, (member) => member);
  }

  Future<Membership> createMembership(Map<String, dynamic> data) async {
    final result = await _repository.createMembership(data);
    await result.fold((failure) => throw failure, (_) => loadMemberships());
    return Membership.fromJson(data);
  }

  Future<Membership> updateMembership(
    String id,
    Map<String, dynamic> updates,
  ) async {
    final result = await _repository.updateMembership(id, updates);
    final membership = await result.fold(
      (failure) => throw failure,
      (membership) => membership,
    );
    await loadMemberships();
    return membership;
  }

  Future<void> deleteMembership(String id) async {
    final result = await _repository.deleteMembership(id);
    await result.fold((failure) => throw failure, (_) => loadMemberships());
  }

  Future<Membership> activateMembership(String id) async {
    final result = await _repository.updateMembership(id, {'status': 'active'});
    final membership = await result.fold(
      (failure) => throw failure,
      (membership) => membership,
    );
    await loadMemberships();
    return membership;
  }

  Future<Membership> deactivateMembership(String id) async {
    final result = await _repository.updateMembership(id, {
      'status': 'inactive',
    });
    final membership = await result.fold(
      (failure) => throw failure,
      (membership) => membership,
    );
    await loadMemberships();
    return membership;
  }
}

// State Notifier Provider
final memberNotifierProvider =
    StateNotifierProvider<MemberNotifier, AsyncValue<List<Membership>>>((ref) {
      final repository = ref.watch(memberRepositoryProvider);
      return MemberNotifier(repository);
    });

// Individual Member Provider
final singleMemberProvider = FutureProvider.family<Membership, String>((
  ref,
  id,
) async {
  final notifier = ref.watch(memberNotifierProvider.notifier);
  return await notifier.getMembership(id);
});
