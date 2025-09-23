import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/features/dashboard/domain/models/dashboard_stats_model.dart';

class DashboardRepository {
  final ApiClient _apiClient;

  DashboardRepository({ApiClient? apiClient}) : _apiClient = apiClient ?? ApiClient();

  Future<DashboardStats> getDashboardStats() async {
    try {
      final response = await _apiClient.get('${ApiConstants.baseUrl}/dashboard/stats');
      
      // Handle the response based on your API structure
      // If your API returns the data directly
      if (response.data != null) {
        return DashboardStats.fromJson(response.data);
      } 
      // If your API wraps the data in a 'data' field
      else if (response.data['data'] != null) {
        return DashboardStats.fromJson(response.data['data']);
      } 
      // If the response is already the data
      else if (response is Map<String, dynamic>) {
        return DashboardStats.fromJson(response as Map<String, dynamic>);
      } 
      else {
        throw Exception('Invalid response format');
      }
    } catch (e) {
      throw Exception('Failed to load dashboard stats: $e');
    }
  }
}
