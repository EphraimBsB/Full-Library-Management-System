import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';
import 'package:management_side/src/features/student/domain/models/profile_summary_model.dart';
import 'package:management_side/src/features/student/data/repositories/student_repository_impl.dart';
import 'package:management_side/src/features/student/domain/repositories/student_repository.dart';

final studentRepositoryProvider = Provider<StudentRepository>((ref) {
  final apiClient = ApiClient();
  return StudentRepositoryImpl(apiClient);
});

// Provider for profile summary
final profileSummaryProvider =
    FutureProvider.family<ProfileSummaryModel, String>((ref, userId) async {
      try {
        final repository = ref.watch(studentRepositoryProvider);
        final result = await repository.getProfileSummary(userId);
        return result.when(
          success: (data) => data,
          failure: (error, stackTrace) => throw error,
        );
      } catch (e) {
        // Log the error and rethrow to be handled by the UI
        debugPrint('Error fetching profile summary: $e');
        rethrow;
      }
    });

// Provider for borrow history
final borrowHistoryProvider = FutureProvider.family<List<Loan>, String>((
  ref,
  userId,
) async {
  try {
    final repository = ref.watch(studentRepositoryProvider);
    final result = await repository.getBorrowHistory(userId);
    return result.when(
      success: (data) => data.data,
      failure: (error, stackTrace) => throw error,
    );
  } catch (e) {
    // Log the error and rethrow to be handled by the UI
    debugPrint('Error fetching borrow history: $e');
    rethrow;
  }
});

// Provider for favorites
final favoritesProvider = FutureProvider.family<List<BookModel>, String>((
  ref,
  userId,
) async {
  try {
    final repository = ref.watch(studentRepositoryProvider);
    final result = await repository.getFavorites(userId);
    return result.when(
      success: (data) => data.data,
      failure: (error, stackTrace) => throw error,
    );
  } catch (e) {
    // Log the error and rethrow to be handled by the UI
    debugPrint('Error fetching favorites: $e');
    rethrow;
  }
});

final userNotesProvider = FutureProvider.family<List<BookNote>, String>((
  ref,
  userId,
) async {
  try {
    final repository = ref.watch(studentRepositoryProvider);
    final result = await repository.getUserNotes(userId);
    return result.when(
      success: (data) => data.data,
      failure: (error, stackTrace) => throw error,
    );
  } catch (e) {
    // Log the error and rethrow to be handled by the UI
    debugPrint('Error fetching user notes: $e');
    rethrow;
  }
});

// Provider for user favorites
final userFavoritesProvider = FutureProvider.family<List<BookModel>, String>((
  ref,
  userId,
) async {
  // TODO: Replace with actual API call to fetch user favorites
  // Example: return await booksRepository.getUserFavorites(userId);
  return [];
});

// Provider for user loans
final userLoansProvider = FutureProvider.family<List<Loan>, String>((
  ref,
  userId,
) async {
  // TODO: Replace with actual API call to fetch user loans
  // Example: return await loansRepository.getUserLoans(userId);
  return [];
});
