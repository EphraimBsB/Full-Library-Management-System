import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/models/subject_model.dart';

abstract class SubjectRepository {
  Future<Either<Failure, List<Subject>>> getSubjects({
    int page,
    int limit,
    String? search,
    bool? isActive,
  });

  Future<Either<Failure, Subject>> getSubject(int id);

  Future<Either<Failure, Subject>> createSubject(Subject subject);

  Future<Either<Failure, Subject>> updateSubject(Subject subject);

  Future<Either<Failure, void>> deleteSubject(int id);

  Future<Either<Failure, void>> toggleSubjectStatus(int id, bool isActive);
}
