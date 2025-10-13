import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/settings/modules/book_types/data/api/book_type_api_service.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/repositories/book_type_repository.dart';

class BookTypeRepositoryImpl implements BookTypeRepository {
  final BookTypeApiService _apiService;

  BookTypeRepositoryImpl(this._apiService);

  @override
  Future<Either<Failure, List<BookType>>> getTypes({
    int page = 1,
    int limit = 10,
    String? search,
    bool? isActive,
  }) async {
    try {
      final response = await _apiService.getTypes(
        page: page,
        limit: limit,
        search: search,
        isActive: isActive,
      );

      final categories = (response as List<dynamic>)
          .map((e) => BookType.fromJson(e as Map<String, dynamic>))
          .toList();

      return Right(categories);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, BookType>> getType(int id) async {
    try {
      final response = await _apiService.getType(id);

      if (response == null) {
        return Left(ServerFailure('Type not found'));
      }

      final type = BookType.fromJson(response as Map<String, dynamic>);
      return Right(type);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure('Failed to load Type: $e'));
    }
  }

  @override
  Future<Either<Failure, BookType>> createType(BookType type) async {
    try {
      final response = await _apiService.createType(type.toJson());
      return Right(BookType.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, BookType>> updateType(BookType type) async {
    try {
      final response = await _apiService.updateType(type.id!, type.toJson());
      return Right(BookType.fromJson(response));
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteType(int id) async {
    try {
      await _apiService.deleteType(id);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> toggleTypeStatus(int id, bool isActive) async {
    try {
      await _apiService.toggleTypeStatus(id, {'isActive': isActive});
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(e.message));
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
