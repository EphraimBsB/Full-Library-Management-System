import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/features/dashboard/domain/models/dashboard_summary_model.dart';

abstract class DashboardSummaryRepository {
  /// Fetches the dashboard summary data
  /// 
  /// Returns [DashboardSummary] if successful
  /// Returns [Failure] if an error occurs
  Future<Either<Failure, DashboardSummary>> getDashboardSummary();
}
