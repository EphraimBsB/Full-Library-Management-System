// class Member {
//   final String id;
//   final String name;
//   final String email;
//   final String phone;
//   final String membershipStatus;
//   final DateTime joinDate;
//   final DateTime? expiryDate;
//   final List<String>? borrowedBooks;

//   Member({
//     required this.id,
//     required this.name,
//     required this.email,
//     required this.phone,
//     required this.membershipStatus,
//     required this.joinDate,
//     this.expiryDate,
//     this.borrowedBooks,
//   });

//   // Helper method to check if membership is active
//   bool get isActive => membershipStatus == 'Active';

//   // Convert to map for Firestore
//   Map<String, dynamic> toMap() {
//     return {
//       'id': id,
//       'name': name,
//       'email': email,
//       'phone': phone,
//       'membershipStatus': membershipStatus,
//       'joinDate': joinDate.toIso8601String(),
//       'expiryDate': expiryDate?.toIso8601String(),
//       'borrowedBooks': borrowedBooks,
//     };
//   }

//   // Create Member from map
//   factory Member.fromMap(Map<String, dynamic> map) {
//     return Member(
//       id: map['id'] ?? '',
//       name: map['name'] ?? '',
//       email: map['email'] ?? '',
//       phone: map['phone'] ?? '',
//       membershipStatus: map['membershipStatus'] ?? 'Inactive',
//       joinDate: DateTime.parse(map['joinDate']),
//       expiryDate: map['expiryDate'] != null 
//           ? DateTime.parse(map['expiryDate']) 
//           : null,
//       borrowedBooks: List<String>.from(map['borrowedBooks'] ?? []),
//     );
//   }
// }
