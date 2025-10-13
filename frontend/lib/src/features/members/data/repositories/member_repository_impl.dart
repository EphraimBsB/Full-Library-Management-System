import 'dart:async';

import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/core/network/network_info.dart';
import 'package:management_side/src/features/members/data/api/member_api_service.dart';
import 'package:management_side/src/features/members/domain/models/membership_model.dart';
import 'package:management_side/src/features/members/domain/repositories/member_repository.dart';

class MemberRepositoryImpl implements MemberRepository {
  final MemberApiService apiService;
  final NetworkInfo networkInfo;

  MemberRepositoryImpl({required this.apiService, required this.networkInfo});

  @override
  Future<Either<Failure, List<Membership>>> getMemberships({
    String? status,
    int? page,
    int? limit,
  }) async {
    if (await networkInfo.isConnected) {
      try {
        final memberships = await apiService.getMemberships(
          status: status,
          page: page,
          limit: limit,
        );
        return Right(memberships);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message));
      } on DioException catch (e) {
        return Left(ServerFailure(e.message ?? 'Failed to load members'));
      } catch (e) {
        return Left(ServerFailure('An unexpected error occurred'));
      }
    } else {
      return const Left(NetworkFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, Membership>> getMembership(String id) async {
    if (await networkInfo.isConnected) {
      try {
        final membership = await apiService.getMembership(id);
        return Right(membership);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message));
      } on DioException catch (e) {
        return Left(ServerFailure(e.message ?? 'Failed to load member'));
      } catch (e) {
        return Left(ServerFailure('An unexpected error occurred'));
      }
    } else {
      return const Left(NetworkFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, Membership>> createMembership(
    Map<String, dynamic> membershipData,
  ) async {
    if (await networkInfo.isConnected) {
      try {
        final membership = await apiService.createMembership(membershipData);
        return Right(membership);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message));
      } on DioException catch (e) {
        return Left(ServerFailure(e.message ?? 'Failed to create member'));
      } catch (e) {
        return Left(ServerFailure('An unexpected error occurred'));
      }
    } else {
      return const Left(NetworkFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, Membership>> updateMembership(
    String id,
    Map<String, dynamic> updates,
  ) async {
    if (await networkInfo.isConnected) {
      try {
        final membership = await apiService.updateMembership(id, updates);
        return Right(membership);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message));
      } on DioException catch (e) {
        return Left(ServerFailure(e.message ?? 'Failed to update member'));
      } catch (e) {
        return Left(ServerFailure('An unexpected error occurred'));
      }
    } else {
      return const Left(NetworkFailure('No internet connection'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteMembership(String id) async {
    if (await networkInfo.isConnected) {
      try {
        await apiService.deleteMembership(id);
        return const Right(null);
      } on ServerException catch (e) {
        return Left(ServerFailure(e.message));
      } on DioException catch (e) {
        return Left(ServerFailure(e.message ?? 'Failed to delete member'));
      } catch (e) {
        return Left(ServerFailure('An unexpected error occurred'));
      }
    } else {
      return const Left(NetworkFailure('No internet connection'));
    }
  }
}
