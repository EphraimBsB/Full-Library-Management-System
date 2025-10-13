class Borrower {
  final String userId;
  final String name;
  final String rollNumber;
  final String email;
  final String phone;

  Borrower({
    required this.userId,
    required this.name,
    required this.rollNumber,
    required this.email,
    required this.phone,
  });

  factory Borrower.fromJson(Map<String, dynamic> json) {
    return Borrower(
      userId: json['user_id'],
      name: json['name'],
      rollNumber: json['roll_number'],
      email: json['email'],
      phone: json['phone'],
    );
  }
}
