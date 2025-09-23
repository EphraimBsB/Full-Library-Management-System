import 'dart:developer';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/books/data/api/book_api_service.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/repositories/book_repository.dart';
import 'package:management_side/src/features/books/data/repositories/book_repository_impl.dart';

// API Client Provider
final apiClientProvider = Provider<Dio>((ref) => ApiClient().dio);

// API Service Provider
final bookApiServiceProvider = Provider<BookApiService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return BookApiService(dio);
});

// Repository Provider
final bookRepositoryProvider = Provider<BookRepository>((ref) {
  return BookRepositoryImpl();
});

// Book List Provider
final bookListProvider = FutureProvider.autoDispose
    .family<PaginatedResponse<BookModel>?, Map<String, dynamic>>((
      ref,
      filters,
    ) async {
      try {
        final repository = ref.watch(bookRepositoryProvider);
        final result = await repository.getBooks(
          page: filters['page'] ?? 1,
          limit: filters['limit'] ?? 10,
          search: filters['search'],
          category: filters['category'],
          status: filters['status'],
          type: filters['type'],
          sort: filters['sort'],
        );

        return result.when(
          success: (data) => data,
          failure: (error, stackTrace) {
            if (kDebugMode) {
              log(
                'Error loading books: $error',
                error: error,
                stackTrace: stackTrace,
              );
            }
            return null;
          },
        );
      } catch (e, stackTrace) {
        if (kDebugMode) {
          log(
            'Unexpected error in bookListProvider',
            error: e,
            stackTrace: stackTrace,
          );
        }
        return null;
      }
    });

// Book Detail Provider
final bookDetailProvider = FutureProvider.autoDispose
    .family<BookModel?, String>((ref, bookId) async {
      try {
        final repository = ref.watch(bookRepositoryProvider);
        final result = await repository.getBook(bookId);
        return result.when(
          success: (book) => book,
          failure: (error, stackTrace) {
            if (kDebugMode) {
              log(
                'Error loading book details: $error',
                error: error,
                stackTrace: stackTrace,
              );
            }
            return null;
          },
        );
      } catch (e, stackTrace) {
        if (kDebugMode) {
          log(
            'Unexpected error in bookDetailProvider',
            error: e,
            stackTrace: stackTrace,
          );
        }
        return null;
      }
    });
