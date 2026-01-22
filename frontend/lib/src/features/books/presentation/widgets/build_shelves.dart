import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/shelves/domain/models/shelf_model.dart';
import 'package:management_side/src/features/settings/modules/shelves/presentation/providers/shelf_providers.dart';

class ShelfAutocomplete extends ConsumerWidget {
  final TextEditingController controller;
  final String? hint;

  const ShelfAutocomplete({
    super.key,
    required this.controller,
    this.hint = 'Shelf',
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shelvesAsync = ref.watch(shelvesNotifierProvider);

    return shelvesAsync.when(
      data: (shelves) {
        return Autocomplete<Shelf>(
          initialValue: TextEditingValue(text: controller.text),
          optionsBuilder: (TextEditingValue textEditingValue) {
            if (textEditingValue.text.isEmpty) {
              return shelves.where((s) => s.isActive);
            }
            return shelves
                .where((s) => s.isActive)
                .where(
                  (s) => s.name.toLowerCase().contains(
                    textEditingValue.text.toLowerCase(),
                  ),
                );
          },
          displayStringForOption: (Shelf option) =>
              '${option.name} (${option.location?.name ?? 'Unknown Location'})',
          fieldViewBuilder:
              (
                BuildContext context,
                TextEditingController textEditingController,
                FocusNode focusNode,
                VoidCallback onFieldSubmitted,
              ) {
                // Update the parent controller when text changes
                textEditingController.addListener(() {
                  controller.text = textEditingController.text;
                });

                return TextFormField(
                  controller: textEditingController,
                  focusNode: focusNode,
                  decoration: InputDecoration(
                    hintText: hint,
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
          onSelected: (Shelf selection) {
            controller.text = selection.name;
          },
        );
      },
      loading: () => TextFormField(
        controller: controller,
        decoration: InputDecoration(
          hintText: hint,
          border: const OutlineInputBorder(),
          suffixIcon: const CircularProgressIndicator(),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 12,
            vertical: 8,
          ),
        ),
      ),
      error: (error, stack) => TextFormField(
        controller: controller,
        decoration: InputDecoration(
          hintText: hint,
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
