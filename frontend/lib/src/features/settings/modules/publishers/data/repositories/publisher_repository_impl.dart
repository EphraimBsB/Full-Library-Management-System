import 'dart:developer' as dev;

import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/publishers/data/api/publisher_api_service.dart';
import 'package:management_side/src/features/settings/modules/publishers/domain/models/publisher_model.dart';
import 'package:management_side/src/features/settings/modules/publishers/domain/repositories/publisher_repository.dart';

class PublisherRepositoryImpl implements PublisherRepository {
  final PublisherApiService _apiService;

  PublisherRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, List<Publisher>>> getPublishers({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  }) async {
    try {
      final response = await _apiService.getPublishers(
        page: page,
        limit: limit,
        search: search,
        isActive: isActive,
      );

      final publishers = (response as List<dynamic>)
          .map((e) => Publisher.fromJson(e as Map<String, dynamic>))
          .toList();

      return Right(publishers);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Publisher>> getPublisher(int id) async {
    try {
      final response = await _apiService.getPublisher(id);

      if (response == null) {
        return Left(ServerFailure('Publisher not found'));
      }

      final publisher = Publisher.fromJson(response as Map<String, dynamic>);
      return Right(publisher);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to load publisher: $e'));
    }
  }

  @override
  Future<Either<Failure, Publisher>> createPublisher(
    Publisher publisher,
  ) async {
    try {
      final response = await _apiService.createPublisher(publisher.toJson());
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to create publisher: $e'));
    }
  }

  @override
  Future<Either<Failure, Publisher>> updatePublisher(
    Publisher publisher,
  ) async {
    try {
      final response = await _apiService.updatePublisher(
        publisher.id!,
        publisher.toJson(),
      );
      return Right(response);
    } on ServerException catch (e) {
      dev.log('Error updating publisher: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      dev.log('Error updating publisher: ${e.toString()}');
      return Left(ServerFailure('Failed to update publisher: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deletePublisher(int id) async {
    try {
      await _apiService.deletePublisher(id);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Publisher>> togglePublisherStatus(int id) async {
    try {
      final response = await _apiService.togglePublisherStatus(id);
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
