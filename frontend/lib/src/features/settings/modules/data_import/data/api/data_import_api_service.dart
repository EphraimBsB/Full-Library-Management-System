// frontend/lib/src/features/settings/modules/data_import/data/api/data_import_api_service.dart
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/data_import/domain/models/import_result.dart';
import 'package:retrofit/retrofit.dart';

part 'data_import_api_service.g.dart';

@RestApi()
abstract class DataImportApiService {
  factory DataImportApiService(ApiClient apiClient) {
    // Get the Dio instance from ApiClient
    final dio = apiClient.dio;

    // Update headers for file upload
    dio.options.headers[HttpHeaders.contentTypeHeader] = 'multipart/form-data';

    return _DataImportApiService(dio, baseUrl: '');
  }

  @POST('/data-import/books/excel')
  @MultiPart()
  Future<ImportResult> importBooks(@Part(name: 'file') File file);
}
