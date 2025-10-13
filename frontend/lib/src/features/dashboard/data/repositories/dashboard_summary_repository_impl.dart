import 'package:dartz/dartz.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/core/network/api_exceptions.dart'
    hide UnauthorizedException, ServerException;
import 'package:management_side/src/features/dashboard/data/api/dashboard_summary_api_service.dart';
import 'package:management_side/src/features/dashboard/domain/models/dashboard_summary_model.dart';
import 'package:management_side/src/features/dashboard/domain/repositories/dashboard_summary_repository.dart';

class DashboardSummaryRepositoryImpl implements DashboardSummaryRepository {
  final DashboardSummaryApiService apiService;

  DashboardSummaryRepositoryImpl({required this.apiService});

  @override
  Future<Either<Failure, DashboardSummary>> getDashboardSummary() async {
    try {
      final dashboardSummary = await apiService.getDashboardSummary();
      return Right(dashboardSummary);
    } on UnauthorizedException {
      return const Left(UnauthorizedFailure('Authentication required'));
    } on ForbiddenException {
      return const Left(UnauthorizedFailure('Insufficient permissions'));
    } on ServerException {
      return const Left(ServerFailure('Failed to load dashboard summary'));
    } catch (e) {
      return Left(ServerFailure('An unexpected error occurred: $e'));
    }
  }
}
