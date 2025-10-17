/// A generic class that holds paginated data along with pagination metadata
class PaginatedResponse<T> {
  /// The list of data in the current page
  final List<T> data;

  /// The total number of data across all pages
  final int total;

  /// The current page number (1-based)
  final int page;

  /// The number of data per page
  final int limit;

  /// The total number of pages
  final int totalPages;

  /// Creates a new [PaginatedResponse] instance
  const PaginatedResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  /// Creates a [PaginatedResponse] from JSON data
  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic) fromJsonT,
  ) {
    return PaginatedResponse<T>(
      data: (json['data'] as List<dynamic>).map(fromJsonT).toList(),
      total: json['total'] as int,
      page: json['page'] as int,
      limit: json['limit'] as int,
      totalPages: json['totalPages'] as int,
    );
  }

  /// Converts this [PaginatedResponse] to JSON
  Map<String, dynamic> toJson(dynamic Function(T) toJsonT) {
    return {
      'data': data.map(toJsonT).toList(),
      'total': total,
      'page': page,
      'limit': limit,
      'totalPages': totalPages,
    };
  }

  /// Creates a copy of this [PaginatedResponse] with the given fields replaced
  PaginatedResponse<T> copyWith({
    List<T>? data,
    int? total,
    int? page,
    int? limit,
    int? totalPages,
  }) {
    return PaginatedResponse<T>(
      data: data ?? this.data,
      total: total ?? this.total,
      page: page ?? this.page,
      limit: limit ?? this.limit,
      totalPages: totalPages ?? this.totalPages,
    );
  }

  /// Returns whether there are more pages available
  bool get hasMore => page < totalPages;

  /// Returns the index of the first item in the current page (1-based)
  int get startIndex => (page - 1) * limit + 1;

  /// Returns the index of the last item in the current page (1-based)
  int get endIndex {
    final end = page * limit;
    return end > total ? total : end;
  }
}
