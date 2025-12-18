// frontend/lib/src/features/settings/modules/data_import/domain/repositories/data_import_repository.dart
import 'dart:io';

import 'package:management_side/src/features/settings/modules/data_import/domain/models/import_result.dart';

abstract class DataImportRepository {
  Future<ImportResult> importBooks(File file);
}
