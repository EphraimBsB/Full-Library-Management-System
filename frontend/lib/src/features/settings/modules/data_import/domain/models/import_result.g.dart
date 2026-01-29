// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'import_result.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

ImportResult _$ImportResultFromJson(Map<String, dynamic> json) => ImportResult(
  total: (json['total'] as num).toInt(),
  imported: (json['imported'] as num).toInt(),
  failed: (json['failed'] as num).toInt(),
  results: (json['results'] as List<dynamic>)
      .map((e) => ImportResultItem.fromJson(e as Map<String, dynamic>))
      .toList(),
  errors: (json['errors'] as List<dynamic>).map((e) => e as String).toList(),
  warnings: (json['warnings'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
  duration: (json['duration'] as num).toInt(),
  timestamp: DateTime.parse(json['timestamp'] as String),
  detailedStats: json['detailedStats'] == null
      ? null
      : DetailedStats.fromJson(json['detailedStats'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ImportResultToJson(ImportResult instance) =>
    <String, dynamic>{
      'total': instance.total,
      'imported': instance.imported,
      'failed': instance.failed,
      'results': instance.results,
      'errors': instance.errors,
      'warnings': instance.warnings,
      'duration': instance.duration,
      'timestamp': instance.timestamp.toIso8601String(),
      'detailedStats': instance.detailedStats,
    };

DetailedStats _$DetailedStatsFromJson(Map<String, dynamic> json) =>
    DetailedStats(
      duplicates: (json['duplicates'] as num).toInt(),
      emptyRows: (json['emptyRows'] as num).toInt(),
      validationErrors: (json['validationErrors'] as num).toInt(),
      worldcatEnriched: (json['worldcatEnriched'] as num).toInt(),
    );

Map<String, dynamic> _$DetailedStatsToJson(DetailedStats instance) =>
    <String, dynamic>{
      'duplicates': instance.duplicates,
      'emptyRows': instance.emptyRows,
      'validationErrors': instance.validationErrors,
      'worldcatEnriched': instance.worldcatEnriched,
    };

ImportResultItem _$ImportResultItemFromJson(Map<String, dynamic> json) =>
    ImportResultItem(
      row: (json['row'] as num).toInt(),
      title: json['title'] as String?,
      success: json['success'] as bool,
      errors: (json['errors'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      createdId: (json['createdId'] as num?)?.toInt(),
      data: json['data'] as Map<String, dynamic>?,
      status: json['status'] as String?,
      isbn: json['isbn'] as String?,
      author: json['author'] as String?,
      publisher: json['publisher'] as String?,
      publicationYear: (json['publicationYear'] as num?)?.toInt(),
    );

Map<String, dynamic> _$ImportResultItemToJson(ImportResultItem instance) =>
    <String, dynamic>{
      'row': instance.row,
      'title': instance.title,
      'success': instance.success,
      'errors': instance.errors,
      'createdId': instance.createdId,
      'data': instance.data,
      'status': instance.status,
      'isbn': instance.isbn,
      'author': instance.author,
      'publisher': instance.publisher,
      'publicationYear': instance.publicationYear,
    };
