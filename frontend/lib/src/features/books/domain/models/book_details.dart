import 'package:management_side/src/features/books/domain/models/book_copy.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/models/current_borrow.dart';
import 'package:management_side/src/features/books/domain/models/borrow_history.dart';
import 'package:management_side/src/features/books/domain/models/queue_request.dart';

class BookDetails {
  final BookModel book;
  final List<CurrentBorrow> currentBorrows;
  final List<BorrowHistory> borrowHistory;
  final List<QueueRequest> queueRequests;

  BookDetails({
    required this.book,
    required this.currentBorrows,
    required this.borrowHistory,
    required this.queueRequests,
  });

  factory BookDetails.fromJson(Map<String, dynamic> json) {
    return BookDetails(
      book: BookModel.fromJson(json['book']),
      currentBorrows: (json['current_borrows'] as List)
          .map((e) => CurrentBorrow.fromJson(e))
          .toList(),
      borrowHistory: (json['borrow_history'] as List)
          .map((e) => BorrowHistory.fromJson(e))
          .toList(),
      queueRequests: (json['queue_requests'] as List)
          .map((e) => QueueRequest.fromJson(e))
          .toList(),
    );
  }
}

class Book {
  final int id;
  final String title;
  final String author;
  final String isbn;
  final String? publisher;
  final int publicationYear;
  final String? edition;
  final List<BookCopy> copies;
  final int totalCopies;
  final int availableCopies;
  final String? description;
  final String? coverImageUrl;
  final List<dynamic> categories;
  final List<dynamic> subjects;
  final String type;
  final String? source;
  final String? ddc;
  final String? from;
  final String? price;
  final String? location;
  final String? shelf;
  final int? queueCount;
  final String? rating;
  final DateTime createdAt;
  final DateTime updatedAt;
  final DateTime? deletedAt;
  final String? ebookUrl;

  Book({
    required this.id,
    required this.title,
    required this.author,
    required this.isbn,
    this.publisher,
    required this.publicationYear,
    this.edition,
    required this.copies,
    required this.totalCopies,
    required this.availableCopies,
    this.description,
    this.coverImageUrl,
    required this.categories,
    required this.subjects,
    required this.type,
    this.source,
    this.ddc,
    this.from,
    this.price,
    this.location,
    this.shelf,
    this.queueCount,
    this.rating,
    required this.createdAt,
    required this.updatedAt,
    this.deletedAt,
    this.ebookUrl,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      author: json['author'] as String? ?? '',
      isbn: json['isbn'] as String? ?? '',
      publisher: json['publisher'] as String?,
      publicationYear: json['publicationYear'] as int? ?? 0,
      edition: json['edition'] as String?,
      copies: (json['copies'] as List<dynamic>? ?? [])
          .map((e) => BookCopy.fromJson(e as Map<String, dynamic>))
          .toList(),
      totalCopies: json['totalCopies'] as int? ?? 0,
      availableCopies: json['availableCopies'] as int? ?? 0,
      description: json['description'] as String?,
      coverImageUrl: json['coverImageUrl'] as String?,
      categories:
          (json['categories'] as List<dynamic>?)
              ?.cast<Map<String, dynamic>>() ??
          [],
      subjects:
          (json['subjects'] as List<dynamic>?)?.cast<Map<String, dynamic>>() ??
          [],
      type: json['type'] as String? ?? 'PHYSICAL',
      source: json['source'] as String?,
      ddc: json['ddc'] as String?,
      from: json['from'] as String?,
      price: json['price'] as String?,
      location: json['location'] as String?,
      shelf: json['shelf'] as String?,
      queueCount: json['queueCount'] as int?,
      rating: json['rating'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString()) ?? DateTime.now()
          : DateTime.now(),
      deletedAt: json['deletedAt'] != null
          ? DateTime.tryParse(json['deletedAt'].toString())
          : null,
      ebookUrl: json['ebookUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'author': author,
      'isbn': isbn,
      'publisher': publisher,
      'publicationYear': publicationYear,
      'edition': edition,
      'copies': copies.map((e) => e.toJson()).toList(),
      'totalCopies': totalCopies,
      'description': description,
      'coverImageUrl': coverImageUrl,
      'categories': categories,
      'subjects': subjects,
      'type': type.toLowerCase(),
      'source': source?.toLowerCase(),
      'ddc': ddc,
      'from': from,
      'price': price,
      'location': location,
      'shelf': shelf,
      // 'rating': rating,
      'ebookUrl': ebookUrl,
    };
  }
}
