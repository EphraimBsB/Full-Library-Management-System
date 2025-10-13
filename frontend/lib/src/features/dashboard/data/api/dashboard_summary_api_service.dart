import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:retrofit/retrofit.dart';

import 'package:management_side/src/features/dashboard/domain/models/dashboard_summary_model.dart';

part 'dashboard_summary_api_service.g.dart';

@RestApi(baseUrl: '')
abstract class DashboardSummaryApiService {
  factory DashboardSummaryApiService(Dio dio, {String? baseUrl}) {
    return _DashboardSummaryApiService(
      dio,
      baseUrl: baseUrl ?? ApiConstants.baseUrl,
    );
  }

  @GET('/dashboard/summary')
  Future<DashboardSummary> getDashboardSummary();
}

class DashboardSummaryApiException implements Exception {
  final String message;
  final int? statusCode;

  DashboardSummaryApiException({required this.message, this.statusCode});

  @override
  String toString() => 'DashboardSummaryApiException: $message';
}
