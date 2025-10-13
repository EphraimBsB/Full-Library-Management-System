// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'loan_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Loan _$LoanFromJson(Map<String, dynamic> json) => Loan(
  id: json['id'] as String,
  bookCopyId: (json['bookCopyId'] as num).toInt(),
  userId: json['userId'] as String,
  queueEntryId: json['queueEntryId'] as String?,
  borrowedAt: DateTime.parse(json['borrowedAt'] as String),
  dueDate: DateTime.parse(json['dueDate'] as String),
  lastRenewedAt: json['lastRenewedAt'] == null
      ? null
      : DateTime.parse(json['lastRenewedAt'] as String),
  returnedAt: json['returnedAt'] == null
      ? null
      : DateTime.parse(json['returnedAt'] as String),
  fineAmount: (json['fineAmount'] as num?)?.toDouble(),
  renewalCount: (json['renewalCount'] as num?)?.toInt() ?? 0,
  status: $enumDecode(_$LoanStatusEnumMap, json['status']),
  notes: json['notes'] as String?,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
  bookCopy: json['bookCopy'] as Map<String, dynamic>?,
  returnedById: json['returnedBy'] as String?,
  requestId: json['requestId'] as String?,
);

Map<String, dynamic> _$LoanToJson(Loan instance) => <String, dynamic>{
  'id': instance.id,
  'bookCopyId': instance.bookCopyId,
  'userId': instance.userId,
  'queueEntryId': instance.queueEntryId,
  'borrowedAt': instance.borrowedAt.toIso8601String(),
  'dueDate': instance.dueDate.toIso8601String(),
  'lastRenewedAt': instance.lastRenewedAt?.toIso8601String(),
  'returnedAt': instance.returnedAt?.toIso8601String(),
  'fineAmount': instance.fineAmount,
  'renewalCount': instance.renewalCount,
  'status': _$LoanStatusEnumMap[instance.status]!,
  'notes': instance.notes,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
  'bookCopy': instance.bookCopy,
  'returnedBy': instance.returnedById,
  'requestId': instance.requestId,
};

const _$LoanStatusEnumMap = {
  LoanStatus.active: 'ACTIVE',
  LoanStatus.borrowed: 'BORROWED',
  LoanStatus.returned: 'RETURNED',
  LoanStatus.overdue: 'OVERDUE',
  LoanStatus.lost: 'LOST',
  LoanStatus.damaged: 'DAMAGED',
};
