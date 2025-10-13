import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/degrees/data/api/degree_api_service.dart';
import 'package:management_side/src/features/settings/modules/degrees/domain/models/degree_model.dart';
import 'package:management_side/src/features/settings/modules/degrees/domain/repositories/degree_repository.dart';

class DegreeRepositoryImpl implements DegreeRepository {
  final DegreeApiService _apiService;

  DegreeRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, List<Degree>>> getDegrees({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  }) async {
    try {
      final response = await _apiService.getDegrees(
        page: page,
        limit: limit,
        search: search,
        isActive: isActive,
      );

      final categories = (response as List<dynamic>)
          .map((e) => Degree.fromJson(e as Map<String, dynamic>))
          .toList();

      return Right(categories);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Degree>> getDegree(int id) async {
    try {
      final response = await _apiService.getDegree(id);

      if (response == null) {
        return Left(ServerFailure('Degree not found'));
      }

      final degree = Degree.fromJson(response as Map<String, dynamic>);
      return Right(degree);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to load Degree: $e'));
    }
  }

  @override
  Future<Either<Failure, Degree>> createDegree(Degree degree) async {
    try {
      final response = await _apiService.createDegree(degree.toJson());
      return Right(Degree.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Degree>> updateDegree(Degree degree) async {
    try {
      final response = await _apiService.updateDegree(
        degree.id,
        degree.toJson(),
      );
      return Right(Degree.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteDegree(int id) async {
    try {
      await _apiService.deleteDegree(id);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> toggleDegreeStatus(
    int id,
    bool isActive,
  ) async {
    try {
      await _apiService.toggleDegreeStatus(id, {'isActive': isActive});
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
