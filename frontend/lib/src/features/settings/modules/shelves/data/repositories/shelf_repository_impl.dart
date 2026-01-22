import 'dart:developer' as dev;

import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/shelves/data/api/shelf_api_service.dart';
import 'package:management_side/src/features/settings/modules/shelves/domain/models/shelf_model.dart';
import 'package:management_side/src/features/settings/modules/shelves/domain/repositories/shelf_repository.dart';

class ShelfRepositoryImpl implements ShelfRepository {
  final ShelfApiService _apiService;

  ShelfRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, List<Shelf>>> getShelves({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  }) async {
    try {
      final response = await _apiService.getShelves(
        page: page,
        limit: limit,
        search: search,
        isActive: isActive,
      );

      final shelves = (response as List<dynamic>)
          .map((e) => Shelf.fromJson(e as Map<String, dynamic>))
          .toList();

      return Right(shelves);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Shelf>> getShelf(int id) async {
    try {
      final response = await _apiService.getShelf(id);

      if (response == null) {
        return Left(ServerFailure('Shelf not found'));
      }

      final shelf = Shelf.fromJson(response as Map<String, dynamic>);
      return Right(shelf);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to load shelf: $e'));
    }
  }

  @override
  Future<Either<Failure, Shelf>> createShelf(Shelf shelf) async {
    try {
      final response = await _apiService.createShelf(shelf.toJson());
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to create shelf: $e'));
    }
  }

  @override
  Future<Either<Failure, Shelf>> updateShelf(Shelf shelf) async {
    try {
      final response = await _apiService.updateShelf(shelf.id!, shelf.toJson());
      return Right(response);
    } on ServerException catch (e) {
      dev.log('Error updating shelf: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      dev.log('Error updating shelf: ${e.toString()}');
      return Left(ServerFailure('Failed to update shelf: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteShelf(int id) async {
    try {
      await _apiService.deleteShelf(id);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Shelf>> toggleShelfStatus(int id) async {
    try {
      final response = await _apiService.toggleShelfStatus(id);
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
