import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/membership-types/data/api/membership_type_api_service.dart';
import 'package:management_side/src/features/settings/modules/membership-types/domain/models/membership_type_model.dart';
import 'package:management_side/src/features/settings/modules/membership-types/domain/repositories/membership_type_repository.dart';

class MembershipTypeRepositoryImpl implements MembershipTypeRepository {
  final MembershipTypeApiService _apiService;

  MembershipTypeRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, List<MembershipType>>> getMembershipTypes({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  }) async {
    try {
      final response = await _apiService.getMembershipTypes(
        page: page,
        limit: limit,
        search: search,
        isActive: isActive,
      );
      
      final membershipTypes = (response as List<dynamic>)
          .map((e) => MembershipType.fromJson(e as Map<String, dynamic>))
          .toList();
          
      return Right(membershipTypes);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, MembershipType>> getMembershipType(int id) async {
    try {
      final response = await _apiService.getMembershipType(id);
      
      if (response == null) {
        return Left(ServerFailure('Membership type not found'));
      }
      
      try {
        final membershipType = MembershipType.fromJson(response as Map<String, dynamic>);
        return Right(membershipType);
      } catch (e) {
        return Left(ServerFailure('Failed to parse membership type data: $e'));
      }
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to load membership type: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, MembershipType>> createMembershipType(MembershipType membershipType) async {
    try {
      final response = await _apiService.createMembershipType(membershipType.toJson());
      return Right(MembershipType.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, MembershipType>> updateMembershipType(MembershipType membershipType) async {
    try {
      final response = await _apiService.updateMembershipType(
        membershipType.id,
        membershipType.toJson(),
      );
      return Right(MembershipType.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteMembershipType(int id) async {
    try {
      await _apiService.deleteMembershipType(id);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> toggleMembershipTypeStatus(int id, bool isActive) async {
    try {
      await _apiService.toggleMembershipTypeStatus(id, {'isActive': isActive});
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
