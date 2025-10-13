import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/user-roles/data/api/user_role_api_service.dart';
import 'package:management_side/src/features/settings/modules/user-roles/domain/models/user_role_model.dart';
import 'package:management_side/src/features/settings/modules/user-roles/domain/repositories/user_role_repository.dart';

class UserRoleRepositoryImpl implements UserRoleRepository {
  final UserRoleApiService _apiService;

  UserRoleRepositoryImpl(ApiClient apiClient)
    : _apiService = UserRoleApiService(apiClient.dio);

  @override
  Future<Either<Failure, List<UserRole>>> getRoles({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  }) async {
    try {
      final response = await _apiService.getUserRoles(
        page: page,
        limit: limit,
        search: search,
        isActive: isActive,
      );
      
      // The API returns a direct list of role objects
      final roles = (response as List<dynamic>)
          .map((e) => UserRole.fromJson(e as Map<String, dynamic>))
          .toList();
          
      return Right(roles);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserRole>> getRole(int id) async {
    try {
      final response = await _apiService.getUserRole(id);
      
      // The API returns the role data directly as a JSON object
      if (response == null) {
        return Left(ServerFailure('Role not found'));
      }
      
      // Convert the response to UserRole
      try {
        final userRole = UserRole.fromJson(response as Map<String, dynamic>);
        return Right(userRole);
      } catch (e) {
        return Left(ServerFailure('Failed to parse role data: $e'));
      }
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to load role: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, UserRole>> createRole(UserRole role) async {
    try {
      final response = await _apiService.createUserRole(role.toJson());
      return Right(UserRole.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, UserRole>> updateRole(UserRole role) async {
    try {
      final response = await _apiService.updateUserRole(
        role.id,
        role.toJson(),
      );
      return Right(UserRole.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteRole(int id) async {
    try {
      await _apiService.deleteUserRole(id);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> toggleRoleStatus(int id, bool isActive) async {
    try {
      await _apiService.toggleUserRoleStatus(id, {'isActive': isActive});
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
