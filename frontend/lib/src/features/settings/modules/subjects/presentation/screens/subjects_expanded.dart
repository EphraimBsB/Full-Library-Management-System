import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/subjects/domain/models/subject_model.dart';
import 'package:management_side/src/features/settings/modules/subjects/presentation/providers/subject_providers.dart';
import 'package:management_side/src/features/settings/modules/subjects/presentation/screens/subjects_dialog.dart';
import 'package:management_side/src/features/settings/presentation/widgets/build_expandable_items.dart';

class SubjectsExpanded extends ConsumerWidget {
  const SubjectsExpanded({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectsAsync = ref.watch(subjectsNotifierProvider);

    return buildExpandableSettingItem(
      icon: Icons.subject,
      title: 'Book Subjects',
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add Subject'),
              onPressed: () => _showSubjectDialog(context, ref, null),
            ),
          ),
          const SizedBox(height: 8),
          subjectsAsync.when(
            data: (categories) => categories.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No categories found'),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: categories.length,
                    itemBuilder: (context, index) {
                      final Subject = categories[index];
                      return _buildSubjectItem(context, ref, Subject);
                    },
                  ),
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: CircularProgressIndicator(),
              ),
            ),
            error: (error, stack) => Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text(
                'Error loading categories: $error',
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectItem(
    BuildContext context,
    WidgetRef ref,
    Subject subject,
  ) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: 0,
      color: Colors.grey.shade50,
      child: ListTile(
        title: Text(
          subject.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        subtitle: subject.description != null
            ? Text(
                subject.description!,
                style: const TextStyle(fontSize: 12),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              )
            : null,
        trailing: IconButton(
          icon: const Icon(
            Icons.remove_red_eye_outlined,
            size: 20,
            color: Colors.grey,
          ),
          onPressed: () => _showSubjectDialog(context, ref, subject),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }

  Future<void> _showSubjectDialog(
    BuildContext context,
    WidgetRef ref,
    Subject? subject,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => SubjectDialog(subject: subject),
    );

    if (result == true && context.mounted) {
      ref.invalidate(subjectsNotifierProvider);
    }
  }
}
