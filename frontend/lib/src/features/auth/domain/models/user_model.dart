import 'package:json_annotation/json_annotation.dart';

part 'user_model.g.dart';

/// User roles in the system
enum UserRole {
  @JsonValue('admin')
  admin,
  @JsonValue('librarian')
  librarian,
  @JsonValue('member')
  member,
  @JsonValue('guest')
  guest,
}

/// Model representing a user in the system
@JsonSerializable()
class UserModel {
  @JsonKey(name: 'id')
  final String? id;

  @JsonKey(name: 'firstName')
  final String? firstName;

  @JsonKey(name: 'lastName')
  final String? lastName;

  @JsonKey(name: 'email')
  final String? email;

  @JsonKey(name: 'rollNumber')
  final String? rollNumber;

  @JsonKey(name: 'phoneNumber')
  final String? phoneNumber;

  @JsonKey(name: 'profileImageUrl')
  final String? profileImageUrl;

  @JsonKey(name: 'course')
  final String? course;

  @JsonKey(name: 'degree')
  final String? degree;

  @JsonKey(name: 'dateOfBirth')
  final DateTime? dateOfBirth;

  @JsonKey(name: 'role')
  final UserRole? role;

  @JsonKey(name: 'isActive')
  final bool isActive;

  @JsonKey(name: 'joinDate')
  final DateTime? joinDate;

  @JsonKey(name: 'expiryDate')
  final DateTime? expiryDate;

  @JsonKey(name: 'createdAt')
  final DateTime? createdAt;

  @JsonKey(name: 'updatedAt')
  final DateTime? updatedAt;
  final String? avatarUrl;

  const UserModel({
    this.id,
    this.firstName,
    this.lastName,
    this.email,
    this.rollNumber,
    this.phoneNumber,
    this.profileImageUrl,
    this.course,
    this.degree,
    this.dateOfBirth,
    this.role,
    this.avatarUrl,
    this.isActive = true,
    this.joinDate,
    this.expiryDate,
    this.createdAt,
    this.updatedAt,
  });

  /// Creates a [UserModel] from JSON data
  factory UserModel.fromJson(Map<String, dynamic> json) =>
      _$UserModelFromJson(json);

  /// Converts this [UserModel] to JSON
  Map<String, dynamic> toJson() => _$UserModelToJson(this);

  // JSON conversion helper

  /// Full name of the user
  String get fullName => '${firstName ?? ''} ${lastName ?? ''}'.trim();

  /// Creates a copy of this user with the given fields replaced by the non-null parameter values.
  UserModel copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? email,
    String? rollNumber,
    String? phoneNumber,
    String? profileImageUrl,
    String? course,
    String? degree,
    DateTime? dateOfBirth,
    UserRole? role,
    String? avatarUrl,
    bool? isActive,
    DateTime? joinDate,
    DateTime? expiryDate,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      rollNumber: rollNumber ?? this.rollNumber,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      course: course ?? this.course,
      degree: degree ?? this.degree,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      role: role ?? this.role,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isActive: isActive ?? this.isActive,
      joinDate: joinDate ?? this.joinDate,
      expiryDate: expiryDate ?? this.expiryDate,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  /// Returns true if the user has admin role
  bool get isAdmin => role == UserRole.admin;

  /// Returns true if the user has librarian role
  bool get isLibrarian => role == UserRole.librarian;

  /// Returns true if the user has member role
  bool get isMember => role == UserRole.member;

  /// Returns true if the user has guest role
  bool get isGuest => role == UserRole.guest;
}
