import 'package:dartz/dartz.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/user-roles/data/repositories/user_role_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/user-roles/domain/models/user_role_model.dart';
import 'package:management_side/src/features/settings/modules/user-roles/domain/repositories/user_role_repository.dart';

final userRoleRepositoryProvider = Provider<UserRoleRepository>((ref) {
  final apiClient = ApiClient();
  return UserRoleRepositoryImpl(apiClient);
});

class UserRolesNotifier extends StateNotifier<AsyncValue<List<UserRole>>> {
  final UserRoleRepository _repository;

  UserRolesNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadRoles();
  }

  Future<void> loadRoles() async {
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getRoles();
      result.fold(
        (failure) => state = AsyncValue.error(failure, StackTrace.current),
        (roles) => state = AsyncValue.data(roles),
      );
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<Either<Failure, UserRole>> getRole(int id) async {
    try {
      final result = await _repository.getRole(id);
      return result;
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  Future<void> toggleRoleStatus(int id, bool isActive) async {
    try {
      final result = await _repository.toggleRoleStatus(id, isActive);
      await result.fold(
        (failure) => throw failure,
        (_) async => await loadRoles(),
      );
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> createRole(UserRole role) async {
    try {
      final result = await _repository.createRole(role);
      await result.fold(
        (failure) => throw failure,
        (_) async => await loadRoles(),
      );
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> updateRole(UserRole role) async {
    try {
      final result = await _repository.updateRole(role);
      await result.fold(
        (failure) => throw failure,
        (_) async => await loadRoles(),
      );
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  Future<void> deleteRole(int id) async {
    try {
      final result = await _repository.deleteRole(id);
      await result.fold(
        (failure) => throw failure,
        (_) async => await loadRoles(),
      );
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

final userRolesProvider =
    StateNotifierProvider<UserRolesNotifier, AsyncValue<List<UserRole>>>(
      (ref) => UserRolesNotifier(ref.watch(userRoleRepositoryProvider)),
    );
