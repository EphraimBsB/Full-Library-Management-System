import 'package:dio/dio.dart';
import 'package:management_side/src/core/data/base_repository.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/models/book_details.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';
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

  @GET('/books/{id}/details')
  Future<BookDetails> getBookDetails(@Path('id') int id);

  @GET('/books/{id}')
  Future<BookModel> getBook(@Path('id') String id);

  @POST('/books')
  Future<BookModel> createBook(@Body() Map<String, dynamic> book);

  @PATCH('/books/{id}')
  Future<BookModel> updateBook(
    @Path('id') int id,
    @Body() Map<String, dynamic> book,
  );

  @DELETE('/books/{id}')
  Future<void> deleteBook(@Path('id') int id);

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

  @GET('/books/notes/book/{bookId}')
  Future<List<BookNote>> getBookNotes(@Path('bookId') int bookId);

  @POST('/books/notes')
  Future<BookNote> createBookNote(@Body() Map<String, dynamic> note);

  @DELETE('/books/notes/{id}')
  Future<void> deleteBookNote(@Path('id') String id);

  @GET('/books/notes/{id}')
  Future<BookNote> getBookNote(@Path('id') String id);

  @PATCH('/books/notes/{id}')
  Future<BookNote> updateBookNote(
    @Path('id') String id,
    @Body() Map<String, dynamic> note,
  );
}
