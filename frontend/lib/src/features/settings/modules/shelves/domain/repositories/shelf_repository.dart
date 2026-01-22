import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/shelves/domain/models/shelf_model.dart';

abstract class ShelfRepository {
  Future<Either<Failure, List<Shelf>>> getShelves({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  });

  Future<Either<Failure, Shelf>> getShelf(int id);

  Future<Either<Failure, Shelf>> createShelf(Shelf shelf);

  Future<Either<Failure, Shelf>> updateShelf(Shelf shelf);

  Future<Either<Failure, void>> deleteShelf(int id);

  Future<Either<Failure, Shelf>> toggleShelfStatus(int id);
}
