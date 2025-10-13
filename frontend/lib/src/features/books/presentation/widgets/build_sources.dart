import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/models/source_model.dart';

Widget buildSourcesField(
  AsyncValue<List<Source>> sourcesAsync,
  Source? selectedSource,
  void Function(Source?) onChanged,
) {
  return sourcesAsync.when(
    data: (sources) {
      return DropdownButtonFormField<Source>(
        value: selectedSource,
        decoration: const InputDecoration(
          labelText: 'Source *',
          border: OutlineInputBorder(),
        ),
        items: [
          const DropdownMenuItem<Source>(
            value: null,
            child: Text('Select a source'),
          ),
          ...sources.map((source) {
            return DropdownMenuItem<Source>(
              value: source,
              child: Text(source.name),
            );
          }).toList(),
        ],
        onChanged: onChanged,
        validator: (value) {
          if (value == null) {
            return 'Please select a source';
          }
          return null;
        },
      );
    },
    loading: () => const CircularProgressIndicator(),
    error: (error, stack) => Text('Error loading sources: $error'),
  );
}
