import 'package:json_annotation/json_annotation.dart';

part 'book_request_model.g.dart';

@JsonSerializable()
class BookRequest {
  final String? id;
  final String? userId;
  final int? bookId;
  final String? status;
  final String? reason;
  final DateTime? approvedAt;
  final DateTime? rejectedAt;
  final String? rejectionReason;
  final DateTime? fulfilledAt;
  final String? queueEntryId;
  final String? approvedById;
  final String? rejectedById;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final Map<String, dynamic>? user;
  final Map<String, dynamic>? book;
  final String? loanId;

  BookRequest({
    this.id,
    this.userId,
    this.bookId,
    this.status,
    this.reason,
    this.approvedAt,
    this.rejectedAt,
    this.rejectionReason,
    this.fulfilledAt,
    this.queueEntryId,
    this.approvedById,
    this.rejectedById,
    this.createdAt,
    this.updatedAt,
    this.user,
    this.book,
    this.loanId,
  });

  factory BookRequest.fromJson(Map<String, dynamic> json) =>
      _$BookRequestFromJson(json);

  Map<String, dynamic> toJson() => _$BookRequestToJson(this);
}
