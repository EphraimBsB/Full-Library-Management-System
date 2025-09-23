class User {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String rollNumber;
  final String? phoneNumber;
  final String? profileImageUrl;
  final String? course;
  final String? degree;
  final DateTime? dateOfBirth;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isActive;
  final DateTime joinDate;
  final DateTime? expiryDate;
  final Map<String, DateTime>? borrowedBooks; // Map of book title to due date

  const User({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.rollNumber,
    this.phoneNumber,
    this.profileImageUrl,
    this.course,
    this.degree,
    this.dateOfBirth,
    required this.createdAt,
    required this.updatedAt,
    this.isActive = true,
    required this.joinDate,
    this.expiryDate,
    this.borrowedBooks,
  });

  String get fullName => '$firstName $lastName';

  User copyWith({
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
    DateTime? createdAt,
    DateTime? updatedAt,
    bool? isActive,
    DateTime? joinDate,
    DateTime? expiryDate,
    Map<String, DateTime>? borrowedBooks,
  }) {
    return User(
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
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isActive: isActive ?? this.isActive,
      joinDate: joinDate ?? this.joinDate,
      expiryDate: expiryDate ?? this.expiryDate,
      borrowedBooks: borrowedBooks ?? this.borrowedBooks,
    );
  }

  // Add fromJson and toJson methods if needed for serialization

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is User && other.id == id && other.email == email;
  }

  @override
  int get hashCode => id.hashCode ^ email.hashCode;
}
