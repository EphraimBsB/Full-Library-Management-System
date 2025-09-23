import 'package:management_side/src/features/loans/data/loan_repository.dart';
import 'package:management_side/src/features/loans/domain/repositories/loan_repository_impl.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final loanRepositoryProvider = Provider<LoanRepository>((ref) {
  // Return your implementation of LoanRepository here
  // For example, if you have a Firestore implementation:
  // return FirestoreLoanRepository();
  
  // For now, we'll use the base implementation
  return LoanRepositoryImpl();
});
