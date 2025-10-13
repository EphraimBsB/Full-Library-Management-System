import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';

Widget buildBookTypesField(
  AsyncValue<List<BookType>> bookTypesAsync,
  BookType? selectedBookType,
  void Function(BookType?) onChanged,
) {
  return bookTypesAsync.when(
    data: (bookTypes) {
      return DropdownButtonFormField<BookType>(
        value: selectedBookType,
        decoration: const InputDecoration(
          labelText: 'Book Type *',
          border: OutlineInputBorder(),
        ),
        items: [
          const DropdownMenuItem<BookType>(
            value: null,
            child: Text('Select a book type'),
          ),
          ...bookTypes.map((bookType) {
            return DropdownMenuItem<BookType>(
              value: bookType,
              child: Text(bookType.name),
            );
          }).toList(),
        ],
        onChanged: onChanged,
        validator: (value) {
          if (value == null) {
            return 'Please select a book type';
          }
          return null;
        },
      );
    },
    loading: () => const CircularProgressIndicator(),
    error: (error, stack) => Text('Error loading categories: $error'),
  );
}
