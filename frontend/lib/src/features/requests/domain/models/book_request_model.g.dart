// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'book_request_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BookRequest _$BookRequestFromJson(Map<String, dynamic> json) => BookRequest(
  id: json['id'] as String?,
  userId: json['userId'] as String?,
  bookId: (json['bookId'] as num?)?.toInt(),
  status: json['status'] as String?,
  reason: json['reason'] as String?,
  approvedAt: json['approvedAt'] == null
      ? null
      : DateTime.parse(json['approvedAt'] as String),
  rejectedAt: json['rejectedAt'] == null
      ? null
      : DateTime.parse(json['rejectedAt'] as String),
  rejectionReason: json['rejectionReason'] as String?,
  fulfilledAt: json['fulfilledAt'] == null
      ? null
      : DateTime.parse(json['fulfilledAt'] as String),
  queueEntryId: json['queueEntryId'] as String?,
  approvedById: json['approvedById'] as String?,
  rejectedById: json['rejectedById'] as String?,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
  user: json['user'] as Map<String, dynamic>?,
  book: json['book'] as Map<String, dynamic>?,
  loanId: json['loanId'] as String?,
);

Map<String, dynamic> _$BookRequestToJson(BookRequest instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'bookId': instance.bookId,
      'status': instance.status,
      'reason': instance.reason,
      'approvedAt': instance.approvedAt?.toIso8601String(),
      'rejectedAt': instance.rejectedAt?.toIso8601String(),
      'rejectionReason': instance.rejectionReason,
      'fulfilledAt': instance.fulfilledAt?.toIso8601String(),
      'queueEntryId': instance.queueEntryId,
      'approvedById': instance.approvedById,
      'rejectedById': instance.rejectedById,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
      'user': instance.user,
      'book': instance.book,
      'loanId': instance.loanId,
    };
