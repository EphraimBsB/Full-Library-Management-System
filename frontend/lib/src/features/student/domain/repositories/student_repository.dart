import 'package:management_side/src/core/utils/result.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/student/data/api/student_api_service.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';
import 'package:management_side/src/features/student/domain/models/profile_summary_model.dart';

abstract class StudentRepository {
  Future<Result<ProfileSummaryModel>> getProfileSummary(String userId);
  Future<Result<BorrowHistoryResponse<Loan>>> getBorrowHistory(
    String userId, {
    int page = 1,
    int limit = 10,
  });

  Future<Result<BorrowHistoryResponse<BookModel>>> getFavorites(
    String userId, {
    int page = 1,
    int limit = 10,
  });

  Future<Result<BorrowHistoryResponse<BookNote>>> getUserNotes(
    String userId, {
    int page = 1,
    int limit = 10,
  });
}
