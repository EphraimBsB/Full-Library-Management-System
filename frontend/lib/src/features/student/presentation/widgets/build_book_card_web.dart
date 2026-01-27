import 'package:flutter/material.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart' show WidgetRef;

import 'package:management_side/src/core/error/failures.dart';

import 'package:management_side/src/core/theme/app_theme.dart' show AppTheme;

import 'package:management_side/src/core/utils/responsive_utils.dart';

import 'package:management_side/src/features/auth/utils/auth_utils.dart';

import 'package:management_side/src/features/books/domain/models/book_copy.dart';

import 'package:management_side/src/features/books/domain/models/book_model_new.dart';

import 'package:management_side/src/features/books/presentation/providers/book_list_providers.dart';

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
        Stack(
          children: [
            Container(
              width: ResponsiveUtils.getBookCoverWidth(context),

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

                child: Image.network(
                  book.coverImageUrl ?? '',
                  headers: const {'Accept': 'image/webp,image/*'},
                  errorBuilder: (context, error, stackTrace) =>
                      Image.asset('assets/default_book.jpg', fit: BoxFit.cover),
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      color: Colors.grey[100],
                      child: const Center(
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppTheme.primaryColor,
                          ),
                        ),
                      ),
                    );
                  },
                  fit: BoxFit.cover,
                ),
              ),
            ),

            if (book.ebookUrl != null)
              Positioned(
                top: 10,

                left: 10,

                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,

                    vertical: 2,
                  ),

                  decoration: BoxDecoration(
                    color: AppTheme.infoColor.withValues(alpha: 0.20),

                    borderRadius: const BorderRadius.all(Radius.circular(4)),

                    border: Border.all(
                      color: AppTheme.infoColor.withValues(alpha: 0.50),
                    ),
                  ),

                  child: Row(
                    children: [
                      Icon(Icons.book, size: 12, color: AppTheme.infoColor),

                      const SizedBox(width: 4),

                      Text(
                        'EBOOK',

                        style: TextStyle(
                          fontSize: 9,

                          fontWeight: FontWeight.bold,

                          color: AppTheme.infoColor,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
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
                        onPressed: () => _handleReadAction(
                          context,

                          ref,

                          book,

                          availableCopies,
                        ),

                        style: ElevatedButton.styleFrom(
                          foregroundColor: Colors.white,

                          backgroundColor: AppTheme.primaryColor,

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
                          foregroundColor: availableCopies > 0
                              ? AppTheme.primaryColor
                              : Colors.grey,

                          backgroundColor: Colors.grey[100],

                          padding: const EdgeInsets.symmetric(vertical: 10),

                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),

                            side: BorderSide(
                              color: availableCopies > 0
                                  ? AppTheme.primaryColor.withValues(alpha: 0.2)
                                  : Colors.grey.withValues(alpha: 0.2),
                            ),
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

void _handleReadAction(
  BuildContext context,

  WidgetRef ref,

  BookModel book,

  int availableCopies,
) async {
  final isAuthenticated = await ensureAuthenticated(
    context,

    message: 'Please log in to read this book',
  );

  if (!isAuthenticated || !context.mounted) return;

  showDialog(
    context: context,

    builder: (context) => AlertDialog(
      backgroundColor: Colors.white,

      title: const Text('Choose Reading Option'),

      content: Column(
        mainAxisSize: MainAxisSize.min,

        children: [
          ListTile(
            leading: const Icon(Icons.menu_book_outlined),

            title: const Text('Read Ebook'),

            subtitle: Text(
              book.ebookUrl != null ? 'Ebook available' : 'Ebook not available',

              style: TextStyle(
                color: book.ebookUrl != null ? Colors.green : Colors.red,

                fontSize: 12,
              ),
            ),

            onTap: book.ebookUrl != null
                ? () {
                    Navigator.pop(context);

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
                  }
                : null,
          ),

          const Divider(),

          ListTile(
            leading: const Icon(Icons.local_library_outlined),

            title: const Text('Read in Library'),

            subtitle: Text(
              availableCopies > 0 ? 'Available' : 'Not available',

              style: TextStyle(
                color: availableCopies > 0 ? Colors.green : Colors.red,

                fontSize: 12,
              ),
            ),

            onTap: availableCopies > 0
                ? () {
                    Navigator.pop(context);

                    _showCopySelectionDialog(
                      context,

                      ref,

                      book,

                      availableCopies,
                    );
                  }
                : null,
          ),
        ],
      ),

      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),

          child: const Text('Cancel'),
        ),
      ],
    ),
  );
}

void _showCopySelectionDialog(
  BuildContext context,

  WidgetRef ref,

  BookModel book,

  int availableCopies,
) async {
  final copiesResult = book.copies ?? [];

  BookCopy? selectedCopy;

  if (copiesResult.isEmpty) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No available copies found')),
      );
    }

    return;
  }

  await showDialog(
    context: context,

    builder: (context) => StatefulBuilder(
      builder: (context, setState) {
        return AlertDialog(
          backgroundColor: Colors.white,

          title: Text(
            selectedCopy == null ? 'Select Copy' : 'Confirm Selection',
          ),

          content: SizedBox(
            width: MediaQuery.of(context).size.width * 0.4,

            height: MediaQuery.of(context).size.height * 0.4,

            child: Column(
              mainAxisSize: MainAxisSize.min,

              crossAxisAlignment: CrossAxisAlignment.start,

              children: [
                if (selectedCopy == null) ...[
                  const Text(
                    'Check on the side of the book to find the copy you want to read.',

                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),

                  const SizedBox(height: 16),
                ] else ...[
                  const Text(
                    'Selected Copy:',

                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 8),

                  Container(
                    padding: const EdgeInsets.all(12),

                    decoration: BoxDecoration(
                      color: Colors.green[50],

                      borderRadius: BorderRadius.circular(8),

                      border: Border.all(color: Colors.green[100]!),
                    ),

                    child: Row(
                      children: [
                        Icon(Icons.book, color: Colors.green[700]),

                        const SizedBox(width: 8),

                        Text(
                          'Copy #${selectedCopy!.accessNumber}',

                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),
                ],

                Expanded(
                  child: GridView.builder(
                    shrinkWrap: true,

                    physics: const NeverScrollableScrollPhysics(),

                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,

                          crossAxisSpacing: 12,

                          mainAxisSpacing: 12,

                          childAspectRatio: 1.3,
                        ),

                    itemCount: copiesResult.length,

                    itemBuilder: (context, index) {
                      final BookCopy copy = copiesResult[index];

                      final isAvailable = copy.status == 'AVAILABLE';

                      final isSelected = selectedCopy?.id == copy.id;

                      return Card(
                        elevation: isSelected ? 3 : 0,

                        color: isSelected ? Colors.blue[50] : Colors.white,

                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),

                          side: BorderSide(
                            color: isSelected
                                ? Colors.blue[300]!
                                : isAvailable
                                ? Colors.green[100]!
                                : Colors.grey[200]!,

                            width: isSelected ? 2 : 1,
                          ),
                        ),

                        child: InkWell(
                          onTap: isAvailable
                              ? () {
                                  setState(() {
                                    selectedCopy = copy;
                                  });
                                }
                              : null,

                          borderRadius: BorderRadius.circular(8),

                          child: Padding(
                            padding: const EdgeInsets.all(12.0),

                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,

                              mainAxisAlignment: MainAxisAlignment.center,

                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      isAvailable
                                          ? isSelected
                                                ? Icons.check_circle
                                                : Icons.check_circle_outline
                                          : Icons.lock_outline,

                                      size: 16,

                                      color: isSelected
                                          ? Colors.blue
                                          : isAvailable
                                          ? Colors.green
                                          : Colors.grey,
                                    ),

                                    const SizedBox(width: 6),

                                    Text(
                                      'Copy #${copy.accessNumber}',

                                      style: TextStyle(
                                        fontWeight: isSelected
                                            ? FontWeight.bold
                                            : FontWeight.normal,

                                        fontSize: 13,
                                      ),

                                      maxLines: 1,

                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ],
                                ),

                                const SizedBox(height: 8),

                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,

                                    vertical: 4,
                                  ),

                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? Colors.blue[100]
                                        : isAvailable
                                        ? Colors.green[50]
                                        : Colors.grey[100],

                                    borderRadius: BorderRadius.circular(12),
                                  ),

                                  child: Text(
                                    _formatStatus(copy.status),

                                    style: TextStyle(
                                      color: isSelected
                                          ? Colors.blue[800]
                                          : isAvailable
                                          ? Colors.green[700]
                                          : Colors.grey[700],

                                      fontSize: 11,

                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),

              child: const Text('Cancel'),
            ),

            if (selectedCopy != null)
              ElevatedButton(
                onPressed: () async {
                  final result = await ref.read(
                    startInhouseUsageProvider({
                      'bookId': book.id,

                      'copyId': selectedCopy!.id,
                    }).future,
                  );

                  if (result["statusCode"] != 201) {
                    await showDialog(
                      context: context,

                      builder: (context) => AlertDialog(
                        title: const Text('Error'),

                        content: Text(
                          result["message"],

                          style: TextStyle(fontSize: 16),
                        ),
                      ),

                      barrierColor: AppTheme.errorColor,
                    );
                  }

                  if (context.mounted) {
                    Navigator.pop(context);

                    if (result != null) {
                      await showDialog(
                        context: context,

                        builder: (context) => AlertDialog(
                          title: const Text('Thank You'),

                          content: const Text(
                            'Please enjoy your reading!, \nclick finish reading when you are done and return the book to the shelf. or on Librarian\'s desk.',

                            style: TextStyle(fontSize: 16),
                          ),

                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(context),

                              child: const Text('Finish Reading'),
                            ),
                          ],
                        ),
                      );
                    }
                  }
                },

                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,

                  foregroundColor: Colors.white,
                ),

                child: const Text('Confirm Selection'),
              ),
          ],
        );
      },
    ),
  );
}

String _formatStatus(String status) {
  switch (status) {
    case 'AVAILABLE':
      return 'Available';

    case 'BORROWED':
      return 'Borrowed';

    case 'LOST':
      return 'Lost';

    case 'DAMAGED':
      return 'Damaged';

    case 'IN_REPAIR':
      return 'In Repair';

    default:
      return status;
  }
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
