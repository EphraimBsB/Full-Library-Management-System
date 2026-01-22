import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/publishers/domain/models/publisher_model.dart';

abstract class PublisherRepository {
  Future<Either<Failure, List<Publisher>>> getPublishers({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  });

  Future<Either<Failure, Publisher>> getPublisher(int id);

  Future<Either<Failure, Publisher>> createPublisher(Publisher publisher);

  Future<Either<Failure, Publisher>> updatePublisher(Publisher publisher);

  Future<Either<Failure, void>> deletePublisher(int id);

  Future<Either<Failure, Publisher>> togglePublisherStatus(int id);
}
