class DashboardStats {
  final int totalBooks;
  final int totalStudents;
  final int issuedBooks;
  final int returnedBooks;
  final int overdueBooks;
  final int availableBooks;
  final int totalCategories;
  final int totalPublishers;

  DashboardStats({
    required this.totalBooks,
    required this.totalStudents,
    required this.issuedBooks,
    required this.returnedBooks,
    required this.overdueBooks,
    required this.availableBooks,
    required this.totalCategories,
    required this.totalPublishers,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalBooks: json['totalBooks'] ?? 0,
      totalStudents: json['totalStudents'] ?? 0,
      issuedBooks: json['issuedBooks'] ?? 0,
      returnedBooks: json['returnedBooks'] ?? 0,
      overdueBooks: json['overdueBooks'] ?? 0,
      availableBooks: json['availableBooks'] ?? 0,
      totalCategories: json['totalCategories'] ?? 0,
      totalPublishers: json['totalPublishers'] ?? 0,
    );
  }
}
