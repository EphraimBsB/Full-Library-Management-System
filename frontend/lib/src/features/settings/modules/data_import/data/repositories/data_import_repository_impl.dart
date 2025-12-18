// frontend/lib/src/features/settings/modules/data_import/data/repositories/data_import_repository_impl.dart
import 'dart:io';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/data_import/data/api/data_import_api_service.dart';
import 'package:management_side/src/features/settings/modules/data_import/domain/models/import_result.dart';
import 'package:management_side/src/features/settings/modules/data_import/domain/repositories/data_import_repository.dart';

class DataImportRepositoryImpl implements DataImportRepository {
  final DataImportApiService _apiService;

  DataImportRepositoryImpl(ApiClient apiClient)
    : _apiService = DataImportApiService(apiClient);

  @override
  Future<ImportResult> importBooks(File file) async {
    try {
      return await _apiService.importBooks(file);
    } catch (e) {
      throw Exception('Failed to import books: $e');
    }
  }
}
