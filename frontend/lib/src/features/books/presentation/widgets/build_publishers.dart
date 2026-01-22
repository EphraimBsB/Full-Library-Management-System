import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/publishers/domain/models/publisher_model.dart';
import 'package:management_side/src/features/settings/modules/publishers/presentation/providers/publisher_providers.dart';

class PublisherAutocomplete extends ConsumerWidget {
  final TextEditingController controller;
  final String? hint;

  const PublisherAutocomplete({
    super.key,
    required this.controller,
    this.hint = 'Publisher',
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final publishersAsync = ref.watch(publishersNotifierProvider);

    return publishersAsync.when(
      data: (publishers) {
        return Autocomplete<Publisher>(
          initialValue: TextEditingValue(text: controller.text),
          optionsBuilder: (TextEditingValue textEditingValue) {
            if (textEditingValue.text.isEmpty) {
              return publishers.where((p) => p.isActive);
            }
            return publishers
                .where((p) => p.isActive)
                .where(
                  (p) => p.name.toLowerCase().contains(
                    textEditingValue.text.toLowerCase(),
                  ),
                );
          },
          displayStringForOption: (Publisher option) => option.name,
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
          onSelected: (Publisher selection) {
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
