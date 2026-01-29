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
  final DetailedStats? detailedStats;

  const ImportResult({
    required this.total,
    required this.imported,
    required this.failed,
    required this.results,
    required this.errors,
    required this.warnings,
    required this.duration,
    required this.timestamp,
    this.detailedStats,
  });

  factory ImportResult.fromJson(Map<String, dynamic> json) =>
      _$ImportResultFromJson(json);

  Map<String, dynamic> toJson() => _$ImportResultToJson(this);
}

@JsonSerializable()
class DetailedStats {
  final int duplicates;
  final int emptyRows;
  final int validationErrors;
  final int worldcatEnriched;

  const DetailedStats({
    required this.duplicates,
    required this.emptyRows,
    required this.validationErrors,
    required this.worldcatEnriched,
  });

  factory DetailedStats.fromJson(Map<String, dynamic> json) =>
      _$DetailedStatsFromJson(json);

  Map<String, dynamic> toJson() => _$DetailedStatsToJson(this);
}

@JsonSerializable()
class ImportResultItem {
  final int row;
  final String? title;
  final bool success;
  final List<String>? errors;
  final int? createdId;
  final Map<String, dynamic>? data;
  final String? status;
  final String? isbn;
  final String? author;
  final String? publisher;
  final int? publicationYear;

  const ImportResultItem({
    required this.row,
    this.title,
    required this.success,
    this.errors,
    this.createdId,
    this.data,
    this.status,
    this.isbn,
    this.author,
    this.publisher,
    this.publicationYear,
  });

  factory ImportResultItem.fromJson(Map<String, dynamic> json) =>
      _$ImportResultItemFromJson(json);

  Map<String, dynamic> toJson() => _$ImportResultItemToJson(this);
}
