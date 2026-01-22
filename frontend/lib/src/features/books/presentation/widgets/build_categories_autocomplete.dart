import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/models/category_model.dart';
import 'package:management_side/src/features/settings/modules/categories/presentation/providers/category_providers.dart';

class CategoriesAutocomplete extends ConsumerWidget {
  final List<Category> selectedCategories;
  final Function(Category) onCategorySelected;
  final Function(Category) onCategoryRemoved;

  const CategoriesAutocomplete({
    super.key,
    required this.selectedCategories,
    required this.onCategorySelected,
    required this.onCategoryRemoved,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesNotifierProvider);

    return categoriesAsync.when(
      data: (categories) {
        final availableCategories = categories
            .where((c) => c.isActive)
            .where(
              (c) => !selectedCategories.any((selected) => selected.id == c.id),
            )
            .toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Autocomplete<Category>(
              optionsBuilder: (TextEditingValue textEditingValue) {
                if (textEditingValue.text.isEmpty) {
                  return availableCategories;
                }
                return availableCategories.where(
                  (c) => c.name.toLowerCase().contains(
                    textEditingValue.text.toLowerCase(),
                  ),
                );
              },
              displayStringForOption: (Category option) => option.name,
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
                        hintText: 'Select categories',
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
              onSelected: (Category selection) {
                onCategorySelected(selection);
              },
            ),
            const SizedBox(height: 8),
            if (selectedCategories.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: selectedCategories.map((category) {
                  return Chip(
                    label: Text(
                      category.name,
                      style: const TextStyle(color: Colors.black),
                    ),
                    onDeleted: () => onCategoryRemoved(category),
                  );
                }).toList(),
              ),
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
      loading: () => TextFormField(
        decoration: InputDecoration(
          hintText: 'Select categories',
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
          hintText: 'Select categories',
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
