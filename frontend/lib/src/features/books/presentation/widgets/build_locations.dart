import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/locations/domain/models/location_model.dart';
import 'package:management_side/src/features/settings/modules/locations/presentation/providers/location_providers.dart';

class LocationAutocomplete extends ConsumerWidget {
  final TextEditingController controller;
  final String? hint;

  const LocationAutocomplete({
    super.key,
    required this.controller,
    this.hint = 'Location',
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locationsAsync = ref.watch(locationsNotifierProvider);

    return locationsAsync.when(
      data: (locations) {
        return Autocomplete<Location>(
          initialValue: TextEditingValue(text: controller.text),
          optionsBuilder: (TextEditingValue textEditingValue) {
            if (textEditingValue.text.isEmpty) {
              return locations.where((l) => l.isActive);
            }
            return locations
                .where((l) => l.isActive)
                .where(
                  (l) => l.name.toLowerCase().contains(
                    textEditingValue.text.toLowerCase(),
                  ),
                );
          },
          displayStringForOption: (Location option) => option.name,
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
          onSelected: (Location selection) {
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
