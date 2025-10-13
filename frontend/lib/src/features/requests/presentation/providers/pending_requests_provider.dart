import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/requests/domain/models/book_request_model.dart';
import 'package:management_side/src/features/requests/presentation/providers/book_request_provider.dart';

final pendingBookRequestsProvider =
    FutureProvider.autoDispose<List<BookRequest>>((ref) async {
      final repository = ref.watch(bookRequestRepositoryProvider);
      final result = await repository.getPendingBookRequests();

      return result.fold(
        (failure) => throw failure,
        (requests) => requests.take(3).toList(),
      );
    });
