import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/subjects/data/api/book_subject_api_service.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/models/subject_model.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/repositories/subject_repository.dart';

class SubjectRepositoryImpl implements SubjectRepository {
  final SubjectApiService _apiService;

  SubjectRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, List<Subject>>> getSubjects({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  }) async {
    try {
      final response = await _apiService.getSubjects(
        page: page,
        limit: limit,
        search: search,
        isActive: isActive,
      );

      final categories = (response as List<dynamic>)
          .map((e) => Subject.fromJson(e as Map<String, dynamic>))
          .toList();

      return Right(categories);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Subject>> getSubject(int id) async {
    try {
      final response = await _apiService.getSubject(id);

      if (response == null) {
        return Left(ServerFailure('Subject not found'));
      }

      final subject = Subject.fromJson(response as Map<String, dynamic>);
      return Right(subject);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to load Subject: $e'));
    }
  }

  @override
  Future<Either<Failure, Subject>> createSubject(Subject subject) async {
    try {
      final response = await _apiService.createSubject(subject.toJson());
      return Right(Subject.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, Subject>> updateSubject(Subject subject) async {
    try {
      final response = await _apiService.updateSubject(
        subject.id!,
        subject.toJson(),
      );
      return Right(Subject.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteSubject(int id) async {
    try {
      await _apiService.deleteSubject(id);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> toggleSubjectStatus(
    int id,
    bool isActive,
  ) async {
    try {
      await _apiService.toggleSubjectStatus(id, {'isActive': isActive});
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
