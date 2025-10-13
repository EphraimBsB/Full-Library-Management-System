import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_book_card.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/presentation/providers/book_list_providers.dart';
import 'package:management_side/src/features/books/presentation/screens/book_details_screen.dart';
import 'package:management_side/src/features/dashboard/presentation/widgets/topbar.dart'
    as dashboard;

class BookListScreen extends StatefulWidget {
  const BookListScreen({super.key});

  @override
  State<BookListScreen> createState() => _BookListScreenState();
}

enum BookStatus { all, available, unavailable }

// Using BookType from book_enums.dart

class _BookListScreenState extends State<BookListScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  // Filter states
  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Widget _buildBookList(List<BookModel> books) {
    return GridView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 6,
        childAspectRatio: 0.7,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: books.length,
      itemBuilder: (context, index) {
        final book = books[index];
        return buildBookCard(
          book,
          onTap: () {
            showBookDetailsDialog(context: context, bookId: book.id!);
          },
        );
      },
    );
  }

  // void _showBookDetails(BookModel book) {
  //   // showBookDetailsDialog(context: context, book: book);
  // }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Consumer(
        builder: (context, ref, _) {
          final booksAsync = ref.watch(allBooksProvider);

          return Column(
            children: [
              const dashboard.TopbarWidget(),
              // _buildFilters(),
              Expanded(
                child: booksAsync.when(
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                  error: (error, stack) => Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Text(
                        'Error loading books. Please try again.\n$error',
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.red),
                      ),
                    ),
                  ),
                  data: (books) {
                    if (books.isEmpty) {
                      return const Center(
                        child: Text(
                          'No books found. Try adjusting your filters.',
                        ),
                      );
                    }
                    return _buildBookList(books);
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
