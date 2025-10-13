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

final allLoansProvider = FutureProvider.autoDispose<List<Loan>>((ref) async {
  try {
    final repository = ref.watch(loanRepositoryProvider);
    final result = await repository.getLoans();
    return result.fold((failure) {
      if (kDebugMode) {
        log('Error loading loans', error: failure);
      }
      return [];
    }, (loans) => loans);
  } catch (e, stackTrace) {
    if (kDebugMode) {
      log(
        'Unexpected error in allLoansProvider',
        error: e,
        stackTrace: stackTrace,
      );
    }
    return [];
  }
});

final filteredLoansProvider = FutureProvider.family
    .autoDispose<List<Loan>, Map<String, dynamic>>((ref, filters) async {
      try {
        final repository = ref.watch(loanRepositoryProvider);
        final result = await repository.getLoans(
          status: filters['status'] as String?,
          userId: filters['userId'] as String?,
          bookId: filters['bookId'] as String?,
          overdueOnly: filters['overdueOnly'] as bool?,
        );
        return result.fold((failure) {
          if (kDebugMode) {
            log('Error loading filtered loans', error: failure);
          }
          return [];
        }, (loans) => loans);
      } catch (e, stackTrace) {
        if (kDebugMode) {
          log(
            'Unexpected error in allLoansProvider',
            error: e,
            stackTrace: stackTrace,
          );
        }
        // Return empty list to prevent UI from breaking
        return [];
      }
    });
