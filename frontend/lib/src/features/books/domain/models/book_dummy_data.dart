import 'package:management_side/src/features/books/domain/models/book_model_new.dart';

class BookDummyData {
  static final List<BookModel> popularBooks = [
    BookModel(
      id: 1,
      title: 'Atomic Habits',
      author: 'James Clear',
      isbn: '0735211299',
      publisher: 'Avery',
      publicationYear: 2018,
      edition: '1st Edition',
      totalCopies: 15,
      availableCopies: 3,
      description:
          'Tiny Changes, Remarkable Results: An Easy & Proven Way to Build Good Habits & Break Bad Ones',
      coverImageUrl: 'https://covers.openlibrary.org/b/isbn/0735211299-L.jpg',
      categories: [Category(id: 1, name: 'Self-Help')],
      subjects: [
        Subject(id: 1, name: 'Personal Development'),
        Subject(id: 2, name: 'Habits'),
        Subject(id: 3, name: 'Psychology'),
      ],
      type: 'physical',
      accessNumbers: List.generate(
        15,
        (index) => AccessNumber(
          id: index + 1,
          number: (index + 1).toString().padLeft(3, '0'),
        ),
      ),
      rating: 4.7,
      createdAt: DateTime(2023, 1, 15),
      updatedAt: DateTime(2023, 1, 15),
    ),
    BookModel(
      id: 2,
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      isbn: '085719768X',
      publisher: 'Harriman House',
      publicationYear: 2020,
      edition: '1st Edition',
      totalCopies: 12,
      availableCopies: 5,
      description: 'Timeless Lessons on Wealth, Greed, and Happiness',
      coverImageUrl: 'https://covers.openlibrary.org/b/isbn/085719768X-L.jpg',
      categories: [
        Category(id: 2, name: 'Finance'),
        Category(id: 3, name: 'Psychology'),
      ],
      subjects: [
        Subject(id: 4, name: 'Wealth Management'),
        Subject(id: 5, name: 'Personal Finance'),
        Subject(id: 6, name: 'Investing'),
      ],
      type: 'physical',
      ebookUrl: 'https://example.com/ebooks/psychology-of-money.epub',
      accessNumbers: List.generate(
        12,
        (i) => AccessNumber(
          id: i + 1,
          number: 'PM-${(i + 1).toString().padLeft(3, '0')}',
        ),
      ),
      rating: 4.8,
      createdAt: DateTime(2023, 2, 10),
      updatedAt: DateTime(2023, 2, 10),
    ),
  ];

  // Get recently added books (last 10 books)
  static List<BookModel> getRecentlyAddedBooks() {
    final books = List<BookModel>.from(popularBooks);
    books.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return books.take(10).toList();
  }

  // Get books by category
  static List<BookModel> getBooksByCategory(String category) {
    return popularBooks
        .where((book) => book.categories.any((c) => c.name == category))
        .toList();
  }

  // Get books by search query
  static List<BookModel> searchBooks(String query) {
    if (query.isEmpty) return [];

    final lowerQuery = query.toLowerCase();
    return popularBooks.where((book) {
      return book.title.toLowerCase().contains(lowerQuery) ||
          book.author.toLowerCase().contains(lowerQuery) ||
          book.isbn.toLowerCase().contains(lowerQuery) ||
          book.categories.any(
            (category) => category.name.toLowerCase().contains(lowerQuery),
          ) ||
          book.subjects.any(
            (subject) => subject.name.toLowerCase().contains(lowerQuery),
          );
    }).toList();
  }
}
