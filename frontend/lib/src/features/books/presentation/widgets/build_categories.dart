import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/models/category_model.dart';

Widget buildCategoryField(
  AsyncValue<List<Category>> categoriesAsync,
  Category? selectedCategory,
  void Function(Category?) onChanged,
) {
  return categoriesAsync.when(
    data: (categories) {
      return DropdownButtonFormField<Category>(
        value: selectedCategory,
        decoration: const InputDecoration(
          labelText: 'Category *',
          border: OutlineInputBorder(),
        ),
        items: [
          const DropdownMenuItem<Category>(
            value: null,
            child: Text('Select a category'),
          ),
          ...categories.map((category) {
            return DropdownMenuItem<Category>(
              value: category,
              child: Text(category.name),
            );
          }).toList(),
        ],
        onChanged: onChanged,
        validator: (value) {
          if (value == null) {
            return 'Please select a category';
          }
          return null;
        },
      );
    },
    loading: () => const CircularProgressIndicator(),
    error: (error, stack) => Text('Error loading categories: $error'),
  );
}
