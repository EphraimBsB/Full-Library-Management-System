import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/network/api_provider.dart';
import 'package:management_side/src/features/requests/data/api/book_request_api_service.dart';
import 'package:management_side/src/features/requests/data/repositories/book_request_repository_impl.dart';
import 'package:management_side/src/features/requests/domain/repositories/book_request_repository.dart';

final bookRequestApiServiceProvider = Provider<BookRequestApiService>((ref) {
  final dio = ref.watch(apiClientProvider);
  return BookRequestApiService(dio);
});

final bookRequestRepositoryProvider = Provider<BookRequestRepository>((ref) {
  final apiService = ref.watch(bookRequestApiServiceProvider);
  return BookRequestRepositoryImpl(apiService);
});
