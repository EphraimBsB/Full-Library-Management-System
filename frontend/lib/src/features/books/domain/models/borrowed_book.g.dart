// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'borrowed_book.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BorrowedBook _$BorrowedBookFromJson(Map<String, dynamic> json) => BorrowedBook(
  id: _idFromJson(json['id']),
  user: json['user'] == null
      ? null
      : UserModel.fromJson(json['user'] as Map<String, dynamic>),
  userId: _idFromJson(json['userId']),
  bookId: _idFromJson(json['bookId']),
  book: json['book'] == null
      ? null
      : BookModel.fromJson(json['book'] as Map<String, dynamic>),
  accessNumber: json['accessNumber'],
  accessNumberId: _idFromJson(json['accessNumberId']),
  borrowedAt: _dateTimeFromJson(json['borrowedAt']),
  dueDate: _dateTimeFromJson(json['dueDate']),
  returnedAt: _dateTimeFromJson(json['returnedAt']),
  fineAmount: _doubleFromJson(json['fineAmount']),
  isReturned: json['isReturned'] == null
      ? false
      : _boolFromJson(json['isReturned']),
  status:
      $enumDecodeNullable(_$BorrowedBookStatusEnumMap, json['status']) ??
      BorrowedBookStatus.borrowed,
  createdAt: _dateTimeFromJson(json['createdAt']),
  updatedAt: _dateTimeFromJson(json['updatedAt']),
);

Map<String, dynamic> _$BorrowedBookToJson(BorrowedBook instance) =>
    <String, dynamic>{
      'id': instance.id,
      'user': instance.user,
      'userId': instance.userId,
      'book': instance.book,
      'bookId': instance.bookId,
      'accessNumber': instance.accessNumber,
      'accessNumberId': instance.accessNumberId,
      'borrowedAt': _dateTimeToJson(instance.borrowedAt),
      'dueDate': _dateTimeToJson(instance.dueDate),
      'returnedAt': _dateTimeToJson(instance.returnedAt),
      'fineAmount': instance.fineAmount,
      'isReturned': instance.isReturned,
      'status': _$BorrowedBookStatusEnumMap[instance.status]!,
      'createdAt': _dateTimeToJson(instance.createdAt),
      'updatedAt': _dateTimeToJson(instance.updatedAt),
    };

const _$BorrowedBookStatusEnumMap = {
  BorrowedBookStatus.requested: 'requested',
  BorrowedBookStatus.pending: 'pending',
  BorrowedBookStatus.borrowed: 'borrowed',
  BorrowedBookStatus.returned: 'returned',
  BorrowedBookStatus.overdue: 'overdue',
  BorrowedBookStatus.rejected: 'rejected',
};
