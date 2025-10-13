import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/degrees/domain/models/degree_model.dart';

abstract class DegreeRepository {
  Future<Either<Failure, List<Degree>>> getDegrees({
    int page,
    int limit,
    String? search,
    bool? isActive,
  });

  Future<Either<Failure, Degree>> getDegree(int id);

  Future<Either<Failure, Degree>> createDegree(Degree degree);

  Future<Either<Failure, Degree>> updateDegree(Degree degree);

  Future<Either<Failure, void>> deleteDegree(int id);

  Future<Either<Failure, void>> toggleDegreeStatus(int id, bool isActive);
}
