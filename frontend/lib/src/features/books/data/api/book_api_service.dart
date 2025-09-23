import 'package:dio/dio.dart';
import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:retrofit/retrofit.dart';
import 'package:management_side/src/core/network/api_constants.dart';

part 'book_api_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
abstract class BookApiService {
  factory BookApiService(Dio dio, {String baseUrl}) = _BookApiService;

  @GET('/books')
  Future<PaginatedResponse<BookModel>> getBooks({
    @Query('page') int page = 1,
    @Query('limit') int limit = 10,
    @Query('search') String? search,
    @Query('category') String? category,
    @Query('status') String? status,
    @Query('type') String? type,
    @Query('sort') String? sort,
  });

  @GET('/books/{id}')
  Future<BookModel> getBook(@Path('id') String id);

  @POST('/books')
  Future<BookModel> createBook(@Body() BookModel book);

  @PUT('/books/{id}')
  Future<BookModel> updateBook(@Path('id') String id, @Body() BookModel book);

  @DELETE('/books/{id}')
  Future<void> deleteBook(@Path('id') String id);

  @POST('/books/{id}/borrow')
  Future<BookModel> borrowBook(
    @Path('id') String bookId,
    @Body() Map<String, dynamic> data,
  );

  @POST('/books/{id}/return')
  Future<BookModel> returnBook(
    @Path('id') String bookId,
    @Body() Map<String, dynamic> data,
  );
}
