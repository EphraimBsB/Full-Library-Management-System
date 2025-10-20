import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/models/subject_model.dart';

Widget buildSubjectsField(
  AsyncValue<List<Subject>> subjectsAsync,
  List<Subject> selectedSubjects,
  void Function(Subject?) onChanged,
  void Function(Subject?) onDelete,
) {
  return subjectsAsync.when(
    data: (subjects) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DropdownButtonFormField<Subject>(
            initialValue: null,
            decoration: InputDecoration(
              hintText: 'Select a subject',
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
              DropdownMenuItem<Subject>(
                value: null,
                child: Text(
                  'Select a subject',
                  style: TextStyle(
                    color: Colors.grey,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ),
              ...subjects.map(
                (subject) => DropdownMenuItem<Subject>(
                  value: subject,
                  child: Text(
                    subject.name,
                    style: TextStyle(color: Colors.black),
                  ),
                ),
              ),
            ],
            onChanged: onChanged,
            validator: (value) {
              if (value == null && selectedSubjects.isEmpty) {
                return 'Please select a subject';
              }
              return null;
            },
          ),
          if (selectedSubjects.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: selectedSubjects.map((subject) {
                return Chip(
                  label: Text(
                    subject.name,
                    style: TextStyle(color: Colors.black),
                  ),
                  onDeleted: () => onDelete(subject),
                );
              }).toList(),
            ),
          ],
          if (selectedSubjects.isEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 4.0),
              child: Text(
                'No subjects selected',
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
    error: (error, stack) => Text('Error loading subjects: $error'),
  );
}
