import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';

part 'inhouse_usage_model.g.dart';

enum InhouseUsageStatus {
  @JsonValue('active')
  active,
  @JsonValue('completed')
  completed,
  @JsonValue('force_ended')
  forceEnded,
}

@JsonSerializable()
class InhouseUsage {
  final String id;
  final Map<String, dynamic> copy;
  final User user;
  final DateTime startedAt;
  final DateTime? endedAt;
  final int? durationMinutes;
  final InhouseUsageStatus status;
  final DateTime createdAt;

  InhouseUsage({
    required this.id,
    required this.copy,
    required this.user,
    required this.startedAt,
    this.endedAt,
    this.durationMinutes,
    required this.status,
    required this.createdAt,
  });

  factory InhouseUsage.fromJson(Map<String, dynamic> json) =>
      _$InhouseUsageFromJson(json);

  Map<String, dynamic> toJson() => _$InhouseUsageToJson(this);
}

@JsonSerializable()
class InhouseUsageListResponse {
  final List<InhouseUsage> items;
  final int total;

  InhouseUsageListResponse({required this.items, required this.total});

  factory InhouseUsageListResponse.fromJson(Map<String, dynamic> json) =>
      _$InhouseUsageListResponseFromJson(json);

  Map<String, dynamic> toJson() => _$InhouseUsageListResponseToJson(this);
}
