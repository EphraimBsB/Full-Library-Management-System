import 'dart:developer' as dev;

import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/locations/data/api/location_api_service.dart';
import 'package:management_side/src/features/settings/modules/locations/domain/models/location_model.dart';
import 'package:management_side/src/features/settings/modules/locations/domain/repositories/location_repository.dart';

class LocationRepositoryImpl implements LocationRepository {
  final LocationApiService _apiService;

  LocationRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, List<Location>>> getLocations({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  }) async {
    try {
      final response = await _apiService.getLocations(
        page: page,
        limit: limit,
        search: search,
        isActive: isActive,
      );

      final locations = (response as List<dynamic>)
          .map((e) => Location.fromJson(e as Map<String, dynamic>))
          .toList();

      return Right(locations);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Location>> getLocation(int id) async {
    try {
      final response = await _apiService.getLocation(id);

      if (response == null) {
        return Left(ServerFailure('Location not found'));
      }

      final location = Location.fromJson(response as Map<String, dynamic>);
      return Right(location);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to load location: $e'));
    }
  }

  @override
  Future<Either<Failure, Location>> createLocation(Location location) async {
    try {
      final response = await _apiService.createLocation(location.toJson());
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to create location: $e'));
    }
  }

  @override
  Future<Either<Failure, Location>> updateLocation(Location location) async {
    try {
      final response = await _apiService.updateLocation(
        location.id!,
        location.toJson(),
      );
      return Right(response);
    } on ServerException catch (e) {
      dev.log('Error updating location: ${e.message}');
      return Left(ServerFailure(e.message));
    } catch (e) {
      dev.log('Error updating location: ${e.toString()}');
      return Left(ServerFailure('Failed to update location: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> deleteLocation(int id) async {
    try {
      await _apiService.deleteLocation(id);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Location>> toggleLocationStatus(int id) async {
    try {
      final response = await _apiService.toggleLocationStatus(id);
      return Right(response);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
