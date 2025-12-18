// frontend/lib/src/features/settings/modules/data_import/presentation/providers/data_import_providers.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/data_import/data/repositories/data_import_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/data_import/domain/models/import_result.dart';
import 'package:management_side/src/features/settings/modules/data_import/domain/repositories/data_import_repository.dart';

final dataImportRepositoryProvider = Provider<DataImportRepository>((ref) {
  final apiClient = ApiClient();
  return DataImportRepositoryImpl(apiClient);
});

final importResultProvider = StateProvider<AsyncValue<ImportResult>?>(
  (ref) => null,
);

final importInProgressProvider = StateProvider<bool>((ref) => false);
