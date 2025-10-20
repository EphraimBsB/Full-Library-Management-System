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
        initialValue: selectedSource,
        decoration: InputDecoration(
          hintText: 'Select a source',
          border: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.grey),
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: Colors.blue, width: 2),
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          filled: true,
          fillColor: Colors.grey[50],
          errorStyle: const TextStyle(fontSize: 12),
          errorMaxLines: 2,
        ),
        items: [
          DropdownMenuItem<Source>(
            value: null,
            child: Text(
              'Select a source',
              style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w400),
            ),
          ),
          ...sources.map((source) {
            return DropdownMenuItem<Source>(
              value: source,
              child: Text(source.name, style: TextStyle(color: Colors.black)),
            );
          }),
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
    loading: () => Container(
      height: 40,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey),
      ),
    ),
    error: (error, stack) => Text('Error loading sources: $error'),
  );
}
