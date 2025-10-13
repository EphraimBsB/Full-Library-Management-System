import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';

abstract class BookTypeRepository {
  Future<Either<Failure, List<BookType>>> getTypes({
    int page,
    int limit,
    String? search,
    bool? isActive,
  });

  Future<Either<Failure, BookType>> getType(int id);

  Future<Either<Failure, BookType>> createType(BookType type);

  Future<Either<Failure, BookType>> updateType(BookType type);

  Future<Either<Failure, void>> deleteType(int id);

  Future<Either<Failure, void>> toggleTypeStatus(int id, bool isActive);
}
