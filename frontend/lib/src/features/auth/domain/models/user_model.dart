import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/settings/modules/user-roles/domain/models/user_role_model.dart';

part 'user_model.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? rollNumber;
  final String? phoneNumber;
  final String? avatarUrl;
  final String? course;
  final String? degree;
  final DateTime? dateOfBirth;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final bool? isActive;
  final DateTime? joinDate;
  final DateTime? expiryDate;
  final UserRole? role;
  final Map<String, DateTime>? borrowedBooks; // Map of book title to due date

  const User({
    required this.id,
    this.firstName,
    this.lastName,
    this.email,
    this.rollNumber,
    this.phoneNumber,
    this.avatarUrl,
    this.course,
    this.degree,
    this.dateOfBirth,
    this.createdAt,
    this.updatedAt,
    this.isActive = true,
    this.joinDate,
    this.expiryDate,
    this.borrowedBooks,
    this.role,
  });

  String get fullName => '$firstName $lastName';

  User copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? email,
    String? rollNumber,
    String? phoneNumber,
    String? avatarUrl,
    String? course,
    String? degree,
    DateTime? dateOfBirth,
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isActive,
    DateTime? joinDate,
    DateTime? expiryDate,
    Map<String, DateTime>? borrowedBooks,
    UserRole? role,
  }) {
    return User(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      rollNumber: rollNumber ?? this.rollNumber,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      course: course ?? this.course,
      degree: degree ?? this.degree,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isActive: isActive ?? this.isActive,
      joinDate: joinDate ?? this.joinDate,
      expiryDate: expiryDate ?? this.expiryDate,
      borrowedBooks: borrowedBooks ?? this.borrowedBooks,
      role: role ?? this.role,
    );
  }

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);

  Map<String, dynamic> toJson() => _$UserToJson(this);

  // Legacy toMap method that uses the generated toJson
  Map<String, dynamic> toMap() => toJson();

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is User && other.id == id && other.email == email;
  }

  @override
  int get hashCode => id.hashCode ^ email.hashCode;
}
