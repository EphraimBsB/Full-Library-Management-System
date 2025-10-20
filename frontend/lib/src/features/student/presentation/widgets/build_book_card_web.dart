import 'package:cached_network_image/cached_network_image.dart'
    show CachedNetworkImage;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart' show WidgetRef;
import 'package:management_side/src/core/error/failures.dart';
import 'package:management_side/src/core/theme/app_theme.dart' show AppTheme;
import 'package:management_side/src/features/auth/utils/auth_utils.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/presentation/screens/ebook_reader_screen.dart';
import 'package:management_side/src/features/requests/presentation/providers/book_request_provider.dart';
import 'package:management_side/src/features/student/presentation/widgets/borrow_request_dialog.dart';

Widget buildBookCardWeb(BookModel book, BuildContext context, WidgetRef ref) {
  final availableCopies = book.copies!
      .where((copy) => copy.status == 'AVAILABLE')
      .length;
  return Container(
    // margin: const EdgeInsets.only(bottom: 20),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(8),
      boxShadow: [
        BoxShadow(
          color: Colors.grey.withOpacity(0.1),
          spreadRadius: 2,
          blurRadius: 10,
          offset: const Offset(0, 2),
        ),
      ],
    ),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Book Cover
        Container(
          width: 172,
          height: double.infinity,
          decoration: BoxDecoration(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(8),
              bottomLeft: Radius.circular(8),
            ),
          ),
          child: ClipRRect(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(8),
              bottomLeft: Radius.circular(8),
            ),
            child: CachedNetworkImage(
              imageUrl: book.coverImageUrl ?? '',
              errorWidget: (context, url, error) =>
                  Image.asset('assets/default_book.jpg', fit: BoxFit.cover),
              placeholder: (context, url) => Container(
                color: Colors.grey[100],
                child: const Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppTheme.primaryColor,
                    ),
                  ),
                ),
              ),
              fit: BoxFit.cover,
            ),
          ),
        ),

        // Book Details
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(12.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  book.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  'by ${book.author}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.star, color: Colors.amber, size: 16),
                    const SizedBox(width: 4),
                    Row(
                      children: [
                        Text(
                          '${book.metadata?["averageRating"] ?? 0.0}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '(${book.metadata?["views"]} views)',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: availableCopies > 0
                            ? Colors.green[50]
                            : Colors.orange[50],
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: availableCopies > 0
                              ? Colors.green[100]!
                              : Colors.orange[100]!,
                        ),
                      ),
                      child: Text(
                        availableCopies > 0 ? 'Available' : 'Borrowed',
                        style: TextStyle(
                          color: availableCopies > 0
                              ? Colors.green[800]
                              : Colors.orange[800],
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  book.description?.isNotEmpty == true
                      ? '${book.description!.substring(0, book.description!.length > 100 ? 100 : book.description!.length)}...'
                      : 'No description available',
                  style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const Spacer(),
                // read now and borrow now buttons
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          // Handle read now action
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => EbookReaderScreen(
                                bookTitle: book.title,
                                ebookUrl: book.ebookUrl!,
                                bookId: book.id!,
                              ),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey[100],
                          foregroundColor: AppTheme.primaryColor,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 0,
                        ),
                        icon: const Icon(Icons.menu_book_outlined, size: 18),
                        label: const Text('Read'),
                      ),
                    ),

                    const SizedBox(width: 12),

                    // Borrow Button
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          // Check authentication before showing borrow dialog
                          final isAuthenticated = await ensureAuthenticated(
                            context,
                            message: 'Please log in to borrow this book',
                          );

                          if (!isAuthenticated || !context.mounted) return;

                          showDialog(
                            context: context,
                            builder: (context) {
                              return BorrowRequestDialog(
                                bookTitle: book.title,
                                onSubmit: (reason) async {
                                  final result = await ref
                                      .read(bookRequestRepositoryProvider)
                                      .createBookRequest(
                                        bookId: book.id.toString(),
                                        reason: reason,
                                      );

                                  if (!context.mounted) return;

                                  Navigator.of(context).pop(); // Close dialog

                                  result.fold(
                                    (failure) {
                                      String errorMessage =
                                          'Failed to submit request';
                                      if (failure is ServerFailure) {
                                        errorMessage = failure.message;
                                      } else if (failure is NetworkFailure) {
                                        errorMessage = 'No internet connection';
                                      }

                                      if (context.mounted) {
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          SnackBar(
                                            content: Text(errorMessage),
                                            backgroundColor: Colors.red,
                                          ),
                                        );
                                      }
                                    },
                                    (bookRequest) {
                                      if (context.mounted) {
                                        _showSuccessDialog(context);
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          const SnackBar(
                                            content: Text(
                                              'Borrow request submitted successfully',
                                            ),
                                            backgroundColor: Colors.green,
                                          ),
                                        );
                                      }
                                    },
                                  );
                                },
                              );
                            },
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: availableCopies > 0
                              ? AppTheme.primaryColor
                              : Colors.grey,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 0,
                        ),
                        icon: Icon(
                          availableCopies > 0
                              ? Icons.add_shopping_cart_outlined
                              : Icons.add_to_queue,
                          size: 18,
                        ),
                        label: availableCopies > 0
                            ? const Text('Borrow')
                            : const Text(
                                'Join Queue',
                                style: TextStyle(fontSize: 12),
                              ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

void _showSuccessDialog(BuildContext context) {
  showDialog(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: Colors.white,
      title: const Text(
        'Request Submitted',
        style: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.green,
        ),
      ),
      content: const Text(
        'Your request has been submitted successfully.\n '
        'An email will be sent to you once approved, or you can see the librarian for approval.',
        style: TextStyle(fontSize: 14),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text(
            'OK',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
      ],
    ),
  );
}
