import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/book_sources/data/api/source_api_service.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/models/source_model.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/repositories/source_repository.dart';

class SourceRepositoryImpl implements SourceRepository {
  final SourceApiService _apiService;

  SourceRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, List<Source>>> getSources({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  }) async {
    try {
      final response = await _apiService.getSources(
        page: page,
        limit: limit,
        search: search,
        isActive: isActive,
      );

      final categories = (response as List<dynamic>)
          .map((e) => Source.fromJson(e as Map<String, dynamic>))
          .toList();

      return Right(categories);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Source>> getSource(int id) async {
    try {
      final response = await _apiService.getSource(id);

      if (response == null) {
        return Left(ServerFailure('Source not found'));
      }

      final source = Source.fromJson(response as Map<String, dynamic>);
      return Right(source);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to load Source: $e'));
    }
  }

  @override
  Future<Either<Failure, Source>> createSource(Source source) async {
    try {
      final response = await _apiService.createSource(source.toJson());
      return Right(Source.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Source>> updateSource(Source source) async {
    try {
      final response = await _apiService.updateSource(
        source.id!,
        source.toJson(),
      );
      return Right(Source.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteSource(int id) async {
    try {
      await _apiService.deleteSource(id);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> toggleSourceStatus(
    int id,
    bool isActive,
  ) async {
    try {
      await _apiService.toggleSourceStatus(id, {'isActive': isActive});
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
