import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/loans/presentation/providers/loan_provider.dart';

final loanProvider = ChangeNotifierProvider<LoanProvider>((ref) {
  // You'll need to provide the LoanRepository here
  // For now, we'll use a placeholder value
  throw UnimplementedError('LoanRepository must be provided');
});
