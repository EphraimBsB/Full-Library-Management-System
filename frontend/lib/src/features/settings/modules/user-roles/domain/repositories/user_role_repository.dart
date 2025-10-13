import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/user-roles/domain/models/user_role_model.dart';

abstract class UserRoleRepository {
  Future<Either<Failure, List<UserRole>>> getRoles({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  });

  Future<Either<Failure, UserRole>> getRole(int id);
  Future<Either<Failure, UserRole>> createRole(UserRole role);
  Future<Either<Failure, UserRole>> updateRole(UserRole role);
  Future<Either<Failure, void>> deleteRole(int id);
  Future<Either<Failure, void>> toggleRoleStatus(int id, bool isActive);
}
