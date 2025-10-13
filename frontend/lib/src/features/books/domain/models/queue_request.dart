class QueueRequest {
  final int position;
  final String userId;
  final String name;
  final String rollNumber;
  final String email;
  final String phone;
  final DateTime requestedAt;

  QueueRequest({
    required this.position,
    required this.userId,
    required this.name,
    required this.rollNumber,
    required this.email,
    required this.phone,
    required this.requestedAt,
  });

  factory QueueRequest.fromJson(Map<String, dynamic> json) {
    return QueueRequest(
      position: json['position'],
      userId: json['user_id'],
      name: json['name'],
      rollNumber: json['roll_number'],
      email: json['email'],
      phone: json['phone'],
      requestedAt: DateTime.parse(json['requested_at']),
    );
  }
}
