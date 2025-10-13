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
          const Text('Subjects *', style: TextStyle(fontSize: 14)),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade400),
              borderRadius: BorderRadius.circular(4),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<Subject>(
                isExpanded: true,
                hint: const Text('Select subjects'),
                value: null,
                items: subjects
                    .where((subject) => !selectedSubjects.contains(subject))
                    .map((subject) {
                      return DropdownMenuItem<Subject>(
                        value: subject,
                        child: Text(subject.name),
                      );
                    })
                    .toList(),
                onChanged: (subject) {
                  if (subject != null) {
                    onChanged(subject);
                  }
                },
              ),
            ),
          ),
          if (selectedSubjects.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: selectedSubjects.map((subject) {
                return Chip(
                  label: Text(subject.name),
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
    loading: () => const CircularProgressIndicator(),
    error: (error, stack) => Text('Error loading subjects: $error'),
  );
}
