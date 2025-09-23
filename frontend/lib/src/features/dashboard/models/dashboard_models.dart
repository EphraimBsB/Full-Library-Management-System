class PendingLoan {
  final String id;
  final String bookTitle;
  final String ddcNumber;
  final String accessNumber;
  final String borrowerName;
  final String rollNumber;
  final DateTime dueDate;
  final String status; // 'Overdue' or 'Due Soon'
  final String coverImage;

  PendingLoan({
    required this.id,
    required this.bookTitle,
    required this.ddcNumber,
    required this.accessNumber,
    required this.borrowerName,
    required this.rollNumber,
    required this.dueDate,
    required this.status,
    required this.coverImage,
  });
}

class ActiveUser {
  final String id;
  final String name;
  final String rollNumber;
  final String course;
  final String profileImage;
  final int booksBorrowed;

  ActiveUser({
    required this.id,
    required this.name,
    required this.rollNumber,
    required this.course,
    required this.profileImage,
    required this.booksBorrowed,
  });
}

// Sample data
final List<PendingLoan> samplePendingLoans = [
  PendingLoan(
    id: '1',
    bookTitle: 'Introduction to Flutter',
    ddcNumber: '005.1',
    accessNumber: '004',
    borrowerName: 'John Doe',
    rollNumber: 'STU-001',
    dueDate: DateTime.now().add(const Duration(days: 2)),
    status: 'Due Soon',
    coverImage:
        'https://covers.openlibrary.org/b/id/10576390-L.jpg', // Flutter book cover
  ),
  PendingLoan(
    id: '2',
    bookTitle: 'Clean Code',
    ddcNumber: '005.12',
    accessNumber: '001',
    borrowerName: 'Jane Smith',
    rollNumber: 'STU-042',
    dueDate: DateTime.now().subtract(const Duration(days: 1)),
    status: 'Overdue',
    coverImage: 'https://covers.openlibrary.org/b/id/10417858-L.jpg',
  ),
  PendingLoan(
    id: '3',
    bookTitle: 'The Pragmatic Programmer',
    ddcNumber: '005.1',
    accessNumber: '007',
    borrowerName: 'Robert Johnson',
    rollNumber: 'STU-078',
    dueDate: DateTime.now().add(const Duration(days: 5)),
    status: 'Due Soon',
    coverImage: 'https://covers.openlibrary.org/b/id/10092258-L.jpg',
  ),
  // PendingLoan(
  //   id: '4',
  //   bookTitle: 'Design Patterns',
  //   ddcNumber: '005.12',
  //   accessNumber: '012',
  //   borrowerName: 'Emily Davis',
  //   rollNumber: 'STU-105',
  //   dueDate: DateTime.now().add(const Duration(days: 1)),
  //   status: 'Due Soon',
  //   coverImage: 'https://covers.openlibrary.org/b/id/10042600-L.jpg',
  // ),
];

final List<ActiveUser> sampleActiveUsers = [
  ActiveUser(
    id: '1',
    name: 'Alex Johnson',
    rollNumber: 'STU-101',
    course: 'BSCS',
    profileImage: 'https://randomuser.me/api/portraits/men/1.jpg',
    booksBorrowed: 12,
  ),
  ActiveUser(
    id: '2',
    name: 'Sarah Williams',
    rollNumber: 'STU-102',
    course: 'BBA',
    profileImage: 'https://randomuser.me/api/portraits/women/2.jpg',
    booksBorrowed: 9,
  ),
  ActiveUser(
    id: '3',
    name: 'Michael Brown',
    rollNumber: 'STU-103',
    course: 'BAIT',
    profileImage: 'https://randomuser.me/api/portraits/men/3.jpg',
    booksBorrowed: 7,
  ),
  ActiveUser(
    id: '4',
    name: 'Emily Wilson',
    rollNumber: 'STU-204',
    course: 'BSCS',
    profileImage: 'https://randomuser.me/api/portraits/women/4.jpg',
    booksBorrowed: 10,
  ),
  ActiveUser(
    id: '5',
    name: 'David Miller',
    rollNumber: 'STU-305',
    course: 'BBA',
    profileImage: 'https://randomuser.me/api/portraits/men/5.jpg',
    booksBorrowed: 5,
  ),
];
