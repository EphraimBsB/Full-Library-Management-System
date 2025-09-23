import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/dashboard/domain/models/dashboard_stats_model.dart';
import 'package:management_side/src/features/dashboard/data/repositories/dashboard_repository.dart';

final dashboardRepositoryProvider = Provider((ref) => DashboardRepository());

final dashboardStatsProvider = FutureProvider<DashboardStats>((ref) async {
  final repository = ref.watch(dashboardRepositoryProvider);
  return repository.getDashboardStats();
});
