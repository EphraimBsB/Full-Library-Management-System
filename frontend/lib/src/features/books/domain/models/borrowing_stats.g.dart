// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'borrowing_stats.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BorrowingStats _$BorrowingStatsFromJson(Map<String, dynamic> json) =>
    BorrowingStats(
      totalBorrowed: (json['totalBorrowed'] as num).toInt(),
      totalReturned: (json['totalReturned'] as num).toInt(),
      currentlyBorrowed: (json['currentlyBorrowed'] as num).toInt(),
      totalOverdue: (json['totalOverdue'] as num).toInt(),
      totalFines: (json['totalFines'] as num?)?.toDouble() ?? 0.0,
    );

Map<String, dynamic> _$BorrowingStatsToJson(BorrowingStats instance) =>
    <String, dynamic>{
      'totalBorrowed': instance.totalBorrowed,
      'totalReturned': instance.totalReturned,
      'currentlyBorrowed': instance.currentlyBorrowed,
      'totalOverdue': instance.totalOverdue,
      'totalFines': instance.totalFines,
    };
