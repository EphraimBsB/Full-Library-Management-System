import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/models/source_model.dart';

abstract class SourceRepository {
  Future<Either<Failure, List<Source>>> getSources({
    int page,
    int limit,
    String? search,
    bool? isActive,
  });

  Future<Either<Failure, Source>> getSource(int id);

  Future<Either<Failure, Source>> createSource(Source source);

  Future<Either<Failure, Source>> updateSource(Source source);

  Future<Either<Failure, void>> deleteSource(int id);

  Future<Either<Failure, void>> toggleSourceStatus(int id, bool isActive);
}
