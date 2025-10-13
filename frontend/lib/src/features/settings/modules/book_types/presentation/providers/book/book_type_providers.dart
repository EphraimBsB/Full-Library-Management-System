import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/settings/modules/book_types/data/api/book_type_api_service.dart';
import 'package:management_side/src/features/settings/modules/book_types/data/repositories/type_repository_impl.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/repositories/book_type_repository.dart';
// Repository Provider
final bookTypeRepositoryProvider = Provider<BookTypeRepository>((ref) {
  final apiClient = ApiClient();
  final apiService = BookTypeApiService(apiClient.dio);
  return BookTypeRepositoryImpl(apiService);
});

// State Notifier
class BookTypesNotifier extends StateNotifier<AsyncValue<List<BookType>>> {
  final BookTypeRepository _repository;

  BookTypesNotifier(this._repository) : super(const AsyncValue.loading()) {
    loadBookTypes();
  }

  Future<void> loadBookTypes() async {
    if (kDebugMode) {
      print('Loading book types...');
    }
    state = const AsyncValue.loading();
    try {
      final result = await _repository.getTypes(
        page: 1,
        limit: 100, // Load all BookTypes
      );
      
      result.fold(
        (failure) {
          if (kDebugMode) {
            print('Error loading book types: ${failure.toString()}');
          }
          state = AsyncValue.error(failure, StackTrace.current);
        },
        (bookTypes) {
          if (kDebugMode) {
            print('Successfully loaded ${bookTypes.length} book types');
            if (bookTypes.isEmpty) {
              print('Warning: No book types found');
            }
          }
          state = AsyncValue.data(bookTypes);
        },
      );
    } catch (e, stackTrace) {
      if (kDebugMode) {
        print('Unexpected error loading book types: $e\n$stackTrace');
      }
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> refresh() => loadBookTypes();

  Future<void> addBookType(BookType bookType) async {
    final result = await _repository.createType(bookType);
    await result.fold((failure) => throw failure, (_) => loadBookTypes());
  }

  Future<void> updateBookType(BookType bookType) async {
    final result = await _repository.updateType(bookType);
    await result.fold((failure) => throw failure, (_) => loadBookTypes());
  }

  Future<void> deleteBookType(int id) async {
    final result = await _repository.deleteType(id);
    await result.fold((failure) => throw failure, (_) => loadBookTypes());
  }

  Future<void> toggleBookTypeStatus(int id, bool isActive) async {
    final result = await _repository.toggleTypeStatus(id, isActive);
    await result.fold((failure) => throw failure, (_) => loadBookTypes());
  }
}

// State Notifier Provider
final bookTypesNotifierProvider =
    StateNotifierProvider<BookTypesNotifier, AsyncValue<List<BookType>>>((ref) {
      final repository = ref.watch(bookTypeRepositoryProvider);
      return BookTypesNotifier(repository);
    });
