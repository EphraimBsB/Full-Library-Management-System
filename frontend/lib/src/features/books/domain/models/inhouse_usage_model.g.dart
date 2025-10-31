// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'inhouse_usage_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InhouseUsage _$InhouseUsageFromJson(Map<String, dynamic> json) => InhouseUsage(
  id: json['id'] as String,
  copy: json['copy'] as Map<String, dynamic>,
  user: User.fromJson(json['user'] as Map<String, dynamic>),
  startedAt: DateTime.parse(json['startedAt'] as String),
  endedAt: json['endedAt'] == null
      ? null
      : DateTime.parse(json['endedAt'] as String),
  durationMinutes: (json['durationMinutes'] as num?)?.toInt(),
  status: $enumDecode(_$InhouseUsageStatusEnumMap, json['status']),
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$InhouseUsageToJson(InhouseUsage instance) =>
    <String, dynamic>{
      'id': instance.id,
      'copy': instance.copy,
      'user': instance.user,
      'startedAt': instance.startedAt.toIso8601String(),
      'endedAt': instance.endedAt?.toIso8601String(),
      'durationMinutes': instance.durationMinutes,
      'status': _$InhouseUsageStatusEnumMap[instance.status]!,
      'createdAt': instance.createdAt.toIso8601String(),
    };

const _$InhouseUsageStatusEnumMap = {
  InhouseUsageStatus.active: 'active',
  InhouseUsageStatus.completed: 'completed',
  InhouseUsageStatus.forceEnded: 'force_ended',
};

InhouseUsageListResponse _$InhouseUsageListResponseFromJson(
  Map<String, dynamic> json,
) => InhouseUsageListResponse(
  items: (json['items'] as List<dynamic>)
      .map((e) => InhouseUsage.fromJson(e as Map<String, dynamic>))
      .toList(),
  total: (json['total'] as num).toInt(),
);

Map<String, dynamic> _$InhouseUsageListResponseToJson(
  InhouseUsageListResponse instance,
) => <String, dynamic>{'items': instance.items, 'total': instance.total};
