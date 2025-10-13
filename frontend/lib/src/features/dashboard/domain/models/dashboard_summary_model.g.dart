// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_summary_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DashboardSummary _$DashboardSummaryFromJson(Map<String, dynamic> json) =>
    DashboardSummary(
      stats: DashboardStats.fromJson(json['stats'] as Map<String, dynamic>),
      recentBooks: (json['recentBooks'] as List<dynamic>)
          .map((e) => BookModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      topRatedBooks: (json['topRatedBooks'] as List<dynamic>)
          .map((e) => BookModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      mostBorrowedBooks: (json['mostBorrowedBooks'] as List<dynamic>)
          .map((e) => BookModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      pendingRequests: (json['pendingRequests'] as List<dynamic>)
          .map((e) => BookRequest.fromJson(e as Map<String, dynamic>))
          .toList(),
      recentOverdues: (json['recentOverdues'] as List<dynamic>)
          .map((e) => Loan.fromJson(e as Map<String, dynamic>))
          .toList(),
      activeUsers: (json['activeUsers'] as List<dynamic>)
          .map((e) => User.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$DashboardSummaryToJson(DashboardSummary instance) =>
    <String, dynamic>{
      'stats': instance.stats,
      'recentBooks': instance.recentBooks,
      'topRatedBooks': instance.topRatedBooks,
      'mostBorrowedBooks': instance.mostBorrowedBooks,
      'pendingRequests': instance.pendingRequests,
      'recentOverdues': instance.recentOverdues,
      'activeUsers': instance.activeUsers,
    };

DashboardStats _$DashboardStatsFromJson(Map<String, dynamic> json) =>
    DashboardStats(
      totalBooks: (json['books'] as num).toInt(),
      totalUsers: (json['users'] as num).toInt(),
      activeLoans: (json['loans'] as num).toInt(),
      overdueLoans: (json['overdue'] as num).toInt(),
    );

Map<String, dynamic> _$DashboardStatsToJson(DashboardStats instance) =>
    <String, dynamic>{
      'books': instance.totalBooks,
      'users': instance.totalUsers,
      'loans': instance.activeLoans,
      'overdue': instance.overdueLoans,
    };
