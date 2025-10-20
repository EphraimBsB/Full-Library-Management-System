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
        initialValue: selectedBookType,
        decoration: InputDecoration(
          hintText: 'Select a book type',
          hintStyle: TextStyle(color: Colors.grey, fontWeight: FontWeight.w400),
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
          errorStyle: const TextStyle(fontSize: 12),
          errorMaxLines: 2,
        ),
        items: [
          DropdownMenuItem<BookType>(
            value: null,
            child: Text(
              'Select a book type',
              style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w400),
            ),
          ),
          ...bookTypes.map((bookType) {
            return DropdownMenuItem<BookType>(
              value: bookType,
              child: Text(bookType.name, style: TextStyle(color: Colors.black)),
            );
          }),
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
    loading: () => Container(
      height: 40,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey),
      ),
    ),
    error: (error, stack) => Text('Error loading categories: $error'),
  );
}
