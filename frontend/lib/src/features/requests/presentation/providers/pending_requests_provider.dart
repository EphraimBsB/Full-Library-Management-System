import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/requests/domain/models/book_request_model.dart';
import 'package:management_side/src/features/requests/domain/repositories/book_request_repository.dart';
import 'package:management_side/src/features/requests/presentation/providers/book_request_provider.dart';

// Request state
class RequestsState {
  final List<BookRequest> requests;
  final bool isLoading;
  final String? error;

  RequestsState({this.requests = const [], this.isLoading = false, this.error});

  RequestsState copyWith({
    List<BookRequest>? requests,
    bool? isLoading,
    String? error,
  }) {
    return RequestsState(
      requests: requests ?? this.requests,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

class PendingRequestsNotifier extends StateNotifier<RequestsState> {
  final BookRequestRepository _repository;

  PendingRequestsNotifier(this._repository) : super(RequestsState()) {
    loadRequests();
  }

  Future<void> loadRequests() async {
    state = state.copyWith(isLoading: true, error: null);
    final result = await _repository.getPendingBookRequests();

    state = result.fold(
      (failure) => state.copyWith(isLoading: false, error: failure.message),
      (requests) =>
          state.copyWith(requests: requests.take(3).toList(), isLoading: false),
    );
  }

  void removeRequest(String requestId) {
    state = state.copyWith(
      requests: state.requests.where((r) => r.id != requestId).toList(),
    );
  }
}

final pendingRequestsNotifierProvider =
    StateNotifierProvider.autoDispose<PendingRequestsNotifier, RequestsState>((
      ref,
    ) {
      return PendingRequestsNotifier(ref.watch(bookRequestRepositoryProvider));
    });

final pendingBookRequestsProvider =
    Provider.autoDispose<AsyncValue<List<BookRequest>>>((ref) {
      final state = ref.watch(pendingRequestsNotifierProvider);
      if (state.isLoading) return const AsyncValue.loading();
      if (state.error != null)
        return AsyncValue.error(state.error!, StackTrace.current);
      return AsyncValue.data(state.requests);
    });
