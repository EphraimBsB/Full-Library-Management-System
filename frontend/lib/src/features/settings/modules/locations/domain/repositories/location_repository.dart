import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/locations/domain/models/location_model.dart';

abstract class LocationRepository {
  Future<Either<Failure, List<Location>>> getLocations({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  });

  Future<Either<Failure, Location>> getLocation(int id);

  Future<Either<Failure, Location>> createLocation(Location location);

  Future<Either<Failure, Location>> updateLocation(Location location);

  Future<Either<Failure, void>> deleteLocation(int id);

  Future<Either<Failure, Location>> toggleLocationStatus(int id);
}
