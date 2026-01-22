import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';
import 'package:management_side/src/features/settings/modules/book_types/presentation/providers/book/book_type_providers.dart';

class BookTypeAutocomplete extends ConsumerWidget {
  final BookType? selectedBookType;
  final Function(BookType?) onBookTypeSelected;

  const BookTypeAutocomplete({
    super.key,
    required this.selectedBookType,
    required this.onBookTypeSelected,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookTypesAsync = ref.watch(bookTypesNotifierProvider);

    return bookTypesAsync.when(
      data: (bookTypes) {
        final activeBookTypes = bookTypes.where((bt) => bt.isActive).toList();

        return Autocomplete<BookType>(
          initialValue: selectedBookType != null
              ? TextEditingValue(text: selectedBookType!.name)
              : const TextEditingValue(),
          optionsBuilder: (TextEditingValue textEditingValue) {
            if (textEditingValue.text.isEmpty) {
              return activeBookTypes;
            }
            return activeBookTypes.where(
              (bt) => bt.name.toLowerCase().contains(
                textEditingValue.text.toLowerCase(),
              ),
            );
          },
          displayStringForOption: (BookType option) => option.name,
          fieldViewBuilder:
              (
                BuildContext context,
                TextEditingController textEditingController,
                FocusNode focusNode,
                VoidCallback onFieldSubmitted,
              ) {
                return TextFormField(
                  controller: textEditingController,
                  focusNode: focusNode,
                  decoration: InputDecoration(
                    hintText: 'Select a book type',
                    border: const OutlineInputBorder(
                      borderRadius: BorderRadius.all(Radius.circular(8)),
                    ),
                    enabledBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: Colors.grey),
                      borderRadius: BorderRadius.all(Radius.circular(8)),
                    ),
                    focusedBorder: const OutlineInputBorder(
                      borderSide: BorderSide(color: Colors.blue, width: 2),
                      borderRadius: BorderRadius.all(Radius.circular(8)),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    filled: true,
                    fillColor: Colors.grey[50],
                  ),
                  onFieldSubmitted: (String value) {
                    onFieldSubmitted();
                  },
                );
              },
          onSelected: (BookType selection) {
            onBookTypeSelected(selection);
          },
        );
      },
      loading: () => TextFormField(
        decoration: InputDecoration(
          hintText: 'Select a book type',
          border: const OutlineInputBorder(),
          suffixIcon: const CircularProgressIndicator(),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 8,
          ),
        ),
      ),
      error: (error, stack) => TextFormField(
        decoration: InputDecoration(
          hintText: 'Select a book type',
          border: const OutlineInputBorder(),
          suffixIcon: const Icon(Icons.error, color: Colors.red),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 8,
          ),
        ),
      ),
    );
  }
}
