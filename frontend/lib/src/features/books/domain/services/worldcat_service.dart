import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/book_model_new.dart';
import '../../../settings/modules/publishers/domain/models/publisher_model.dart';
import '../../../settings/modules/categories/domain/models/category_model.dart';
import '../../../settings/modules/subjects/domain/models/subject_model.dart';

class WorldCatService {
  // WorldCat Search API endpoint
  static const String _baseUrl =
      'https://www.worldcat.org/webservices/catalog/search/worldcat/opensearch';

  // OCLC Developer Network API key (you'll need to register for one)
  // For development, you can use a test key or implement your own proxy
  static const String _apiKey =
      'YOUR_WORLDCAT_API_KEY'; // Replace with actual API key

  /// Fetch book information by ISBN from WorldCat
  static Future<BookModel?> fetchBookByISBN(String isbn) async {
    try {
      // Clean ISBN (remove hyphens, spaces)
      final cleanISBN = isbn.replaceAll(RegExp(r'[^0-9Xx]'), '');

      if (cleanISBN.length < 10 || cleanISBN.length > 13) {
        throw Exception('Invalid ISBN format');
      }

      // WorldCat Search API request
      final url = Uri.parse(
        '$_baseUrl?q=isbn:$cleanISBN&wskey=$_apiKey&format=json',
      );

      final response = await http.get(
        url,
        headers: {'User-Agent': 'LMS-App/1.0', 'Accept': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return _parseWorldCatResponse(data, cleanISBN);
      } else if (response.statusCode == 401) {
        throw Exception('Invalid API key. Please configure WorldCat API key.');
      } else if (response.statusCode == 404) {
        throw Exception('Book not found in WorldCat database.');
      } else {
        throw Exception('Failed to fetch book data: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching book from WorldCat: $e');
    }
  }

  /// Alternative: Use Google Books API (free, no API key required for basic usage)
  static Future<BookModel?> fetchBookByISBNFromGoogle(String isbn) async {
    try {
      // Clean ISBN
      final cleanISBN = isbn.replaceAll(RegExp(r'[^0-9Xx]'), '');

      if (cleanISBN.length < 10 || cleanISBN.length > 13) {
        throw Exception('Invalid ISBN format');
      }

      // Google Books API request
      final url = Uri.parse(
        'https://www.googleapis.com/books/v1/volumes?q=isbn:$cleanISBN',
      );

      final response = await http.get(
        url,
        headers: {'User-Agent': 'LMS-App/1.0'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['totalItems'] > 0) {
          return _parseGoogleBooksResponse(data['items'][0], cleanISBN);
        } else {
          throw Exception('Book not found in Google Books database.');
        }
      } else {
        throw Exception('Failed to fetch book data: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error fetching book from Google Books: $e');
    }
  }

  /// Parse WorldCat API response
  static BookModel _parseWorldCatResponse(
    Map<String, dynamic> data,
    String isbn,
  ) {
    // This is a simplified parser - WorldCat response structure may vary
    // You'll need to adjust based on actual API response format

    final entry = data['feed']?['entry']?[0];
    if (entry == null) {
      throw Exception('No book data found in WorldCat response');
    }

    final title = _extractTitle(entry);
    final authors = _extractAuthors(entry);
    final publisher = _extractPublisher(entry);
    final year = _extractYear(entry);
    final description = _extractDescription(entry);
    final ddc = _extractDDC(entry);

    return BookModel(
      id: null, // New book
      title: title,
      author: authors.isNotEmpty ? authors.join(', ') : '',
      description: description,
      isbn: isbn,
      ddc: ddc,
      edition: '', // WorldCat may not provide this
      publicationYear: year,
      publisher: publisher,
      totalCopies: 1, // Default value
      location: null,
      shelf: null,
      coverImageUrl: '', // WorldCat may provide cover URLs
      ebookUrl: '',
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      copies: [],
      categories: [],
      subjects: [],
      type: null,
      source: null,
      price: null,
    );
  }

  /// Parse Google Books API response
  static BookModel _parseGoogleBooksResponse(
    Map<String, dynamic> item,
    String isbn,
  ) {
    final volumeInfo = item['volumeInfo'] ?? {};

    final title = volumeInfo['title'] ?? '';
    final authors = (volumeInfo['authors'] as List?)?.join(', ') ?? '';
    final publisher = volumeInfo['publisher'] ?? '';
    final publishedDate = volumeInfo['publishedDate'] ?? '';
    final description = volumeInfo['description'] ?? '';
    final industryIdentifiers =
        volumeInfo['industryIdentifiers'] as List? ?? [];

    // Extract publication year
    int? year;
    if (publishedDate.isNotEmpty) {
      year = int.tryParse(publishedDate.split('-').first);
    }

    // Extract DDC from categories (Google Books doesn't provide DDC directly)
    String ddc = '';
    final categories = volumeInfo['categories'] as List? ?? [];
    if (categories.isNotEmpty) {
      // You could implement a mapping from categories to DDC
      ddc = ''; // Placeholder
    }

    // Get cover image
    String coverUrl = '';
    final imageLinks = volumeInfo['imageLinks'] ?? {};
    if (imageLinks['thumbnail'] != null) {
      coverUrl = imageLinks['thumbnail'];
    }

    return BookModel(
      id: null, // New book
      title: title,
      author: authors,
      description: description,
      isbn: isbn,
      ddc: ddc,
      edition: '', // Google Books may not provide this
      publicationYear: year,
      publisher: publisher,
      totalCopies: 1, // Default value
      location: null,
      shelf: null,
      coverImageUrl: coverUrl,
      ebookUrl: '', // Google Books may provide preview link
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
      copies: [],
      categories: [],
      subjects: [],
      type: null,
      source: null,
      price: null,
    );
  }

  // Helper methods for extracting data from WorldCat response
  static String _extractTitle(Map<String, dynamic> entry) {
    final titles = entry['title'] as List? ?? [];
    return titles.isNotEmpty ? titles.first.toString() : '';
  }

  static List<String> _extractAuthors(Map<String, dynamic> entry) {
    final authors = <String>[];
    // Extract authors based on WorldCat response structure
    // This is a placeholder - implement based on actual response format
    return authors;
  }

  static String _extractPublisher(Map<String, dynamic> entry) {
    // Extract publisher based on WorldCat response structure
    return '';
  }

  static int? _extractYear(Map<String, dynamic> entry) {
    // Extract publication year based on WorldCat response structure
    return null;
  }

  static String _extractDescription(Map<String, dynamic> entry) {
    // Extract description based on WorldCat response structure
    return '';
  }

  static String _extractDDC(Map<String, dynamic> entry) {
    // Extract Dewey Decimal Classification based on WorldCat response structure
    return '';
  }
}
