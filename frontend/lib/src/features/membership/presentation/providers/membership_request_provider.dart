import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/membership/data/api/membership_api_service.dart';
import 'package:management_side/src/features/membership/data/repositories/membership_request_repository_impl.dart';
import 'package:management_side/src/features/membership/domain/models/membership_request_model.dart';
import 'package:management_side/src/features/membership/domain/repositories/membership_request_repository.dart';

// API Service Provider
final dioProvider = Provider<Dio>((ref) => ApiClient().dio);

final membershipApiServiceProvider = Provider<MembershipApiService>((ref) {
  final dio = ref.watch(dioProvider);
  return MembershipApiService(dio);
});

// Repository Provider
final membershipRequestRepositoryProvider =
    Provider<MembershipRequestRepository>((ref) {
      final apiService = ref.watch(membershipApiServiceProvider);
      return MembershipRequestRepositoryImpl(apiService);
    });

// State Notifier
class MembershipRequestNotifier
    extends StateNotifier<AsyncValue<List<MembershipRequest>>> {
  final MembershipRequestRepository _repository;

  MembershipRequestNotifier(this._repository)
    : super(const AsyncValue.loading()) {
    loadMembershipRequests();
  }

  Future<void> loadMembershipRequests() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getMembershipRequests();
      state = result.fold(
        (failure) => AsyncValue.error(failure, StackTrace.current),
        (requests) => AsyncValue.data(requests),
      );
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> refresh() => loadMembershipRequests();

  Future<MembershipRequest> getMembershipRequest(String id) async {
    final result = await _repository.getMembershipRequest(id);
    return result.fold((failure) => throw failure, (request) => request);
  }

  Future<MembershipRequest> createMembershipRequest(
    MembershipRequest request,
  ) async {
    final result = await _repository.createMembershipRequest(request.toJson());
    await result.fold(
      (failure) => throw failure,
      (_) => loadMembershipRequests(),
    );
    return request;
  }

  Future<MembershipRequest> updateMembershipRequest(
    String id,
    MembershipRequest request,
  ) async {
    final result = await _repository.updateMembershipRequest(
      id,
      updates: request.toJson(),
    );
    await result.fold(
      (failure) => throw failure,
      (_) => loadMembershipRequests(),
    );
    return request;
  }

  Future<void> deleteMembershipRequest(String id) async {
    final result = await _repository.deleteMembershipRequest(id);
    await result.fold(
      (failure) => throw failure,
      (_) => loadMembershipRequests(),
    );
  }

  Future<Map<String, dynamic>> approveMembershipRequest(String id) async {
    final result = await _repository.approveMembershipRequest(id);
    final request = await result.fold(
      (failure) => throw failure,
      (request) => request,
    );
    await loadMembershipRequests();
    return request;
  }

  Future<Map<String, dynamic>> rejectMembershipRequest(
    String id,
    String reason,
  ) async {
    final result = await _repository.rejectMembershipRequest(
      id,
      reason: reason,
    );
    final request = await result.fold(
      (failure) => throw failure,
      (request) => request,
    );
    await loadMembershipRequests();
    return request;
  }
}

// State Notifier Provider
final membershipRequestNotifierProvider =
    StateNotifierProvider<
      MembershipRequestNotifier,
      AsyncValue<List<MembershipRequest>>
    >((ref) {
      final repository = ref.watch(membershipRequestRepositoryProvider);
      return MembershipRequestNotifier(repository);
    });

// Individual Request Provider
final singleMembershipRequestProvider =
    FutureProvider.family<MembershipRequest, String>((ref, id) async {
      final notifier = ref.watch(membershipRequestNotifierProvider.notifier);
      return await notifier.getMembershipRequest(id);
    });
