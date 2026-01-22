import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/models/subject_model.dart';
import 'package:management_side/src/features/settings/modules/subjects/presentation/providers/subject_providers.dart';

class SubjectsAutocomplete extends ConsumerWidget {
  final List<Subject> selectedSubjects;
  final Function(Subject) onSubjectSelected;
  final Function(Subject) onSubjectRemoved;

  const SubjectsAutocomplete({
    super.key,
    required this.selectedSubjects,
    required this.onSubjectSelected,
    required this.onSubjectRemoved,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectsAsync = ref.watch(subjectsNotifierProvider);

    return subjectsAsync.when(
      data: (subjects) {
        final availableSubjects = subjects
            .where((s) => s.isActive)
            .where(
              (s) => !selectedSubjects.any((selected) => selected.id == s.id),
            )
            .toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Autocomplete<Subject>(
              optionsBuilder: (TextEditingValue textEditingValue) {
                if (textEditingValue.text.isEmpty) {
                  return availableSubjects;
                }
                return availableSubjects.where(
                  (s) => s.name.toLowerCase().contains(
                    textEditingValue.text.toLowerCase(),
                  ),
                );
              },
              displayStringForOption: (Subject option) => option.name,
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
                        hintText: 'Select subjects',
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
              onSelected: (Subject selection) {
                onSubjectSelected(selection);
              },
            ),
            const SizedBox(height: 8),
            if (selectedSubjects.isNotEmpty)
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: selectedSubjects.map((subject) {
                  return Chip(
                    label: Text(
                      subject.name,
                      style: const TextStyle(color: Colors.black),
                    ),
                    onDeleted: () => onSubjectRemoved(subject),
                  );
                }).toList(),
              ),
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
      loading: () => TextFormField(
        decoration: InputDecoration(
          hintText: 'Select subjects',
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
          hintText: 'Select subjects',
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
