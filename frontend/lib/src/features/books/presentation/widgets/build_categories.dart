import 'package:flutter/material.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/models/category_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

Widget buildCategoriesField(
  AsyncValue<List<Category>> categoriesAsync,
  List<Category> selectedCategories,
  void Function(Category?) onChanged,
  void Function(Category?) onDelete,
) {
  return categoriesAsync.when(
    data: (categories) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<Category>(
            initialValue: null,
            decoration: InputDecoration(
              hintText: 'Select a category',
              border: const OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(8)),
              ),
              enabledBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: Colors.grey),
                borderRadius: BorderRadius.all(Radius.circular(8)),
              ),
              focusedBorder: OutlineInputBorder(
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
              DropdownMenuItem<Category>(
                value: null,
                child: Text(
                  'Select a category',
                  style: TextStyle(
                    color: Colors.grey,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ),
              ...categories.map(
                (category) => DropdownMenuItem<Category>(
                  value: category,
                  child: Text(
                    category.name,
                    style: TextStyle(color: Colors.black),
                  ),
                ),
              ),
            ],
            onChanged: onChanged,
            validator: (value) {
              if (value == null && selectedCategories.isEmpty) {
                return 'Please select a category';
              }
              return null;
            },
          ),
          if (selectedCategories.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: selectedCategories.map((category) {
                return Chip(
                  label: Text(
                    category.name,
                    style: TextStyle(color: Colors.black),
                  ),
                  onDeleted: () => onDelete(category),
                );
              }).toList(),
            ),
          ],
          if (selectedCategories.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 4.0),
              child: Text(
                'No categories selected',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
            ),
        ],
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
