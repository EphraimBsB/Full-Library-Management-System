import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/domain/repositories/book_repository.dart';
import 'package:management_side/src/features/books/data/repositories/book_repository_impl.dart';
import 'package:management_side/src/features/books/domain/models/category_model.dart';
import 'package:management_side/src/features/books/domain/models/subject_model.dart';
import 'package:management_side/src/features/books/data/repositories/category_repository_impl.dart';
import 'package:management_side/src/features/books/data/repositories/subject_repository_impl.dart';
import 'package:management_side/src/features/books/domain/repositories/category_repository.dart';
import 'package:management_side/src/features/books/domain/repositories/subject_repository.dart';

final bookRepositoryProvider = Provider<BookRepository>((ref) {
  return BookRepositoryImpl();
});

final categoryRepositoryProvider = Provider<CategoryRepository>((ref) {
  return CategoryRepositoryImpl();
});

final subjectRepositoryProvider = Provider<SubjectRepository>((ref) {
  return SubjectRepositoryImpl();
});

final allBooksProvider = FutureProvider.autoDispose<List<BookModel>>((
  ref,
) async {
  final repository = ref.watch(bookRepositoryProvider);
  final result = await repository.getBooks();
  return result.when(
    success: (paginatedBooks) => paginatedBooks.items,
    failure: (error, stackTrace) {
      print('Error loading books: $error');
      if (stackTrace != null) {
        print('Stack trace: $stackTrace');
      }
      return [];
    },
  );
});

final allCategoriesProvider = FutureProvider.autoDispose<List<CategoryModel>>((
  ref,
) async {
  final repository = ref.watch(categoryRepositoryProvider);
  try {
    return await repository.getCategories();
  } catch (error, stackTrace) {
    print('Error loading categories: $error');
    print('Stack trace: $stackTrace');
    return [];
  }
});

final allSubjectsProvider = FutureProvider.autoDispose<List<SubjectModel>>((
  ref,
) async {
  final repository = ref.watch(subjectRepositoryProvider);
  try {
    return await repository.getSubjects();
  } catch (error, stackTrace) {
    print('Error loading subjects: $error');
    print('Stack trace: $stackTrace');
    return [];
  }
});
