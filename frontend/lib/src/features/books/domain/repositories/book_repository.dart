import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/core/utils/result.dart';
import 'package:management_side/src/features/books/domain/models/book_details.dart'
    as model;
import 'package:management_side/src/features/books/domain/models/book_model_new.dart'
    as model;
import 'package:management_side/src/features/books/domain/models/book_details.dart';

/// Interface for book repository operations
abstract class BookRepository {
  /// Get paginated list of books with optional filters
  Future<Result<PaginatedResponse<model.BookModel>>> getBooks({
    int page = 1,
    int limit = 10,
    String? search,
    String? category,
    String? status,
    String? type,
    String? sort,
  });

  /// Get a single book by ID
  Future<Result<model.BookModel>> getBook(String id);

  /// Create a new book
  Future<Result<model.BookModel>> createBook(model.BookModel book);

  /// Update an existing book
  Future<Result<model.BookModel>> updateBook(model.BookModel book, int id);

  /// Delete a book by ID
  Future<Result<void>> deleteBook(int id);

  /// Borrow a book
  Future<Result<model.BookModel>> borrowBook({
    required String bookId,
    required String userId,
    required DateTime dueDate,
  });

  /// Return a borrowed book
  Future<Result<model.BookModel>> returnBook({
    required String bookId,
    required String userId,
  });

  /// Get detailed information about a book including copies and borrow history
  Future<Result<BookDetails>> getBookDetails(int id);
}
