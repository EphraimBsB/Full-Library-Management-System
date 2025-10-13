import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_provider.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/dashboard/data/api/dashboard_summary_api_service.dart';
import 'package:management_side/src/features/dashboard/data/repositories/dashboard_summary_repository_impl.dart';
import 'package:management_side/src/features/dashboard/domain/models/dashboard_summary_model.dart';
import 'package:management_side/src/features/dashboard/domain/repositories/dashboard_summary_repository.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/requests/domain/models/book_request_model.dart';

// API Service provider
final dashboardSummaryApiServiceProvider = Provider<DashboardSummaryApiService>(
  (ref) {
    final dio = ref.watch(apiClientProvider);
    return DashboardSummaryApiService(dio);
  },
);

// Repository provider
final dashboardSummaryRepositoryProvider = Provider<DashboardSummaryRepository>(
  (ref) {
    final apiService = ref.watch(dashboardSummaryApiServiceProvider);
    return DashboardSummaryRepositoryImpl(apiService: apiService);
  },
);

// State notifier for managing dashboard summary state
class DashboardSummaryNotifier
    extends StateNotifier<AsyncValue<DashboardSummary>> {
  final DashboardSummaryRepository _repository;

  DashboardSummaryNotifier(this._repository)
    : super(const AsyncValue.loading()) {
    loadDashboardSummary();
  }

  // Load dashboard summary data
  Future<void> loadDashboardSummary() async {
    state = const AsyncValue.loading();

    final result = await _repository.getDashboardSummary();

    state = result.fold(
      (failure) => AsyncValue.error(failure.message, StackTrace.current),
      (summary) => AsyncValue.data(summary),
    );
  }

  // Refresh dashboard summary data
  Future<void> refresh() async {
    await loadDashboardSummary();
  }
}

// Provider for the DashboardSummaryNotifier
final dashboardSummaryProvider =
    StateNotifierProvider<
      DashboardSummaryNotifier,
      AsyncValue<DashboardSummary>
    >((ref) {
      final repository = ref.watch(dashboardSummaryRepositoryProvider);
      return DashboardSummaryNotifier(repository);
    });

// Convenience providers for accessing specific parts of the dashboard summary
final dashboardSummaryStatsProvider = Provider<DashboardStats>((ref) {
  final summaryAsync = ref.watch(dashboardSummaryProvider);
  return summaryAsync.when(
    data: (summary) => summary.stats,
    loading: () => DashboardStats(
      totalBooks: 0,
      totalUsers: 0,
      activeLoans: 0,
      overdueLoans: 0,
    ),
    error: (error, _) =>
        throw Exception('Failed to load dashboard stats: $error'),
  );
});

final recentBooksProvider = Provider<List<BookModel>>((ref) {
  final summaryAsync = ref.watch(dashboardSummaryProvider);
  return summaryAsync.when(
    data: (summary) => summary.recentBooks,
    loading: () => [],
    error: (_, __) => [],
  );
});

final topRatedBooksProvider = Provider<List<BookModel>>((ref) {
  final summaryAsync = ref.watch(dashboardSummaryProvider);
  return summaryAsync.when(
    data: (summary) => summary.topRatedBooks,
    loading: () => [],
    error: (_, __) => [],
  );
});

final mostBorrowedBooksProvider = Provider<List<BookModel>>((ref) {
  final summaryAsync = ref.watch(dashboardSummaryProvider);
  return summaryAsync.when(
    data: (summary) => summary.mostBorrowedBooks,
    loading: () => [],
    error: (_, __) => [],
  );
});

final pendingRequestsProvider = Provider<List<BookRequest>>((ref) {
  final summaryAsync = ref.watch(dashboardSummaryProvider);
  return summaryAsync.when(
    data: (summary) => summary.pendingRequests,
    loading: () => [],
    error: (_, __) => [],
  );
});

final recentOverduesProvider = Provider<List<Loan>>((ref) {
  final summaryAsync = ref.watch(dashboardSummaryProvider);
  return summaryAsync.when(
    data: (summary) => summary.recentOverdues,
    loading: () => [],
    error: (_, __) => [],
  );
});

final activeUsersProvider = Provider<List<User>>((ref) {
  final summaryAsync = ref.watch(dashboardSummaryProvider);
  return summaryAsync.when(
    data: (summary) => summary.activeUsers,
    loading: () => [],
    error: (_, __) => [],
  );
});
