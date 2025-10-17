import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/core/utils/result.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/student/data/api/student_api_service.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';
import 'package:management_side/src/features/student/domain/models/profile_summary_model.dart';
import 'package:management_side/src/features/student/domain/repositories/student_repository.dart';

class StudentRepositoryImpl extends BaseRepository
    implements StudentRepository {
  final StudentApiService _apiService;

  StudentRepositoryImpl(ApiClient apiClient)
    : _apiService = StudentApiService(apiClient.dio);

  @override
  Future<Result<ProfileSummaryModel>> getProfileSummary(String userId) async {
    return handleApiCall<ProfileSummaryModel>(
      () => _apiService.getProfileSummary(userId),
      errorMessage: 'Failed to load profile summary',
    );
  }

  @override
  Future<Result<BorrowHistoryResponse<Loan>>> getBorrowHistory(
    String userId, {
    int page = 1,
    int limit = 10,
  }) async {
    return handleApiCall<BorrowHistoryResponse<Loan>>(
      () => _apiService.getBorrowHistory(userId, page: page, limit: limit),
      errorMessage: 'Failed to load borrow history',
    );
  }

  @override
  Future<Result<BorrowHistoryResponse<BookModel>>> getFavorites(
    String userId, {
    int page = 1,
    int limit = 10,
  }) async {
    return handleApiCall<BorrowHistoryResponse<BookModel>>(
      () => _apiService.getFavorites(userId, page: page, limit: limit),
      errorMessage: 'Failed to load favorites',
    );
  }

  @override
  Future<Result<BorrowHistoryResponse<BookNote>>> getUserNotes(
    String userId, {
    int page = 1,
    int limit = 10,
  }) async {
    print(_apiService.getUserNotes(userId, page: page, limit: limit));
    return handleApiCall<BorrowHistoryResponse<BookNote>>(
      () => _apiService.getUserNotes(userId, page: page, limit: limit),
      errorMessage: 'Failed to load user notes',
    );
  }
}
