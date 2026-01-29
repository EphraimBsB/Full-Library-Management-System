import 'dart:developer';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_provider.dart';
import 'package:management_side/src/features/loans/data/api/loan_api_service.dart';
import 'package:management_side/src/features/loans/data/repositories/loan_repository_impl.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/loans/domain/repositories/loan_repository.dart';

// API Service Provider
final loanApiServiceProvider = Provider<LoanApiService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return LoanApiService(dio);
});

// Repository Provider
final loanRepositoryProvider = Provider<LoanRepository>((ref) {
  final apiService = ref.watch(loanApiServiceProvider);
  return LoanRepositoryImpl(apiService);
});

// Loan state
class LoanState {
  final List<Loan> loans;
  final bool isLoading;
  final String? error;

  LoanState({this.loans = const [], this.isLoading = false, this.error});

  LoanState copyWith({List<Loan>? loans, bool? isLoading, String? error}) {
    return LoanState(
      loans: loans ?? this.loans,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class LoanNotifier extends StateNotifier<LoanState> {
  final LoanRepository _repository;

  LoanNotifier(this._repository) : super(LoanState()) {
    loadLoans();
  }

  Future<void> loadLoans({
    String? status,
    String? userId,
    String? bookId,
    bool? overdueOnly,
    int? page,
    int? limit,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await _repository.getLoans(
      status: status,
      userId: userId,
      bookId: bookId,
      overdueOnly: overdueOnly,
      page: page,
      limit: limit,
    );

    state = result.fold(
      (failure) => state.copyWith(isLoading: false, error: failure.message),
      (paginatedResponse) =>
          state.copyWith(loans: paginatedResponse.data, isLoading: false),
    );
  }

  Future<void> createLoan(Loan loan) async {
    final result = await _repository.createLoan(loan);
    result.fold((failure) => throw failure, (newLoan) {
      state = state.copyWith(loans: [newLoan, ...state.loans]);
    });
  }

  Future<void> returnBook(String loanId) async {
    final result = await _repository.returnBook(loanId);
    result.fold((failure) => throw failure, (updatedLoan) {
      state = state.copyWith(
        loans: state.loans
            .map((l) => l.id == loanId ? updatedLoan : l)
            .toList(),
      );
    });
  }

  Future<void> renewLoan(String loanId) async {
    final result = await _repository.renewLoan(loanId);
    result.fold((failure) => throw failure, (updatedLoan) {
      state = state.copyWith(
        loans: state.loans
            .map((l) => l.id == loanId ? updatedLoan : l)
            .toList(),
      );
    });
  }

  Future<void> deleteLoan(String loanId) async {
    final result = await _repository.deleteLoan(loanId);
    result.fold((failure) => throw failure, (_) {
      state = state.copyWith(
        loans: state.loans.where((l) => l.id != loanId).toList(),
      );
    });
  }
}

final loanNotifierProvider =
    StateNotifierProvider.autoDispose<LoanNotifier, LoanState>((ref) {
      return LoanNotifier(ref.watch(loanRepositoryProvider));
    });

final allLoansProvider = Provider.autoDispose<AsyncValue<List<Loan>>>((ref) {
  final loanState = ref.watch(loanNotifierProvider);
  if (loanState.isLoading) return const AsyncValue.loading();
  if (loanState.error != null)
    return AsyncValue.error(loanState.error!, StackTrace.current);
  return AsyncValue.data(loanState.loans);
});

final userLoansProvider = FutureProvider.family
    .autoDispose<List<Loan>, Map<String, dynamic>>((ref, filters) async {
      try {
        final repository = ref.watch(loanRepositoryProvider);
        final result = await repository.getUserLoans(
          filters['userId'] as String,
          status: filters['status'] as String?,
          page: filters['page'] as int?,
          limit: filters['limit'] as int?,
        );
        return result.fold((failure) {
          if (kDebugMode) {
            log('Error loading user loans', error: failure);
          }
          return [];
        }, (loans) => loans);
      } catch (e, stackTrace) {
        if (kDebugMode) {
          log(
            'Unexpected error in userLoansProvider',
            error: e,
            stackTrace: stackTrace,
          );
        }
        // Return empty list to prevent UI from breaking
        return [];
      }
    });
