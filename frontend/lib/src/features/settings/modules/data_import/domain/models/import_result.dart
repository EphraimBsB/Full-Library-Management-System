// frontend/lib/src/features/settings/modules/data_import/domain/models/import_result.dart
import 'package:json_annotation/json_annotation.dart';

part 'import_result.g.dart';

@JsonSerializable()
class ImportResult {
  final int total;
  final int imported;
  final int failed;
  final List<ImportResultItem> results;
  final List<String> errors;
  final List<String> warnings;
  final int duration;
  final DateTime timestamp;

  const ImportResult({
    required this.total,
    required this.imported,
    required this.failed,
    required this.results,
    required this.errors,
    required this.warnings,
    required this.duration,
    required this.timestamp,
  });

  factory ImportResult.fromJson(Map<String, dynamic> json) =>
      _$ImportResultFromJson(json);

  Map<String, dynamic> toJson() => _$ImportResultToJson(this);
}

@JsonSerializable()
class ImportResultItem {
  final int row;
  final String? title;
  final bool success;
  final List<String>? errors;
  final int? createdId;
  final Map<String, dynamic>? data;

  const ImportResultItem({
    required this.row,
    this.title,
    required this.success,
    this.errors,
    this.createdId,
    this.data,
  });

  factory ImportResultItem.fromJson(Map<String, dynamic> json) =>
      _$ImportResultItemFromJson(json);

  Map<String, dynamic> toJson() => _$ImportResultItemToJson(this);
}
