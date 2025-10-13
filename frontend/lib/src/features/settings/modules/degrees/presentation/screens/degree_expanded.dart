import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/settings/modules/degrees/domain/models/degree_model.dart';
import 'package:management_side/src/features/settings/modules/degrees/presentation/providers/degree_providers.dart';
import 'package:management_side/src/features/settings/modules/degrees/presentation/screens/degree_dialog.dart';
import 'package:management_side/src/features/settings/presentation/widgets/build_expandable_items.dart';

class DegreesExpanded extends ConsumerWidget {
  const DegreesExpanded({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final degreesAsync = ref.watch(degreesNotifierProvider);

    return buildExpandableSettingItem(
      icon: Icons.type_specimen,
      title: 'School Degrees',
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add Degree'),
              onPressed: () => _showDegreeDialog(context, ref, null),
            ),
          ),
          const SizedBox(height: 8),
          degreesAsync.when(
            data: (degrees) => degrees.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No Degrees found'),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: degrees.length,
                    itemBuilder: (context, index) {
                      final degree = degrees[index];
                      return _buildDegreeItem(context, ref, degree);
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
                'Error loading degrees: $error',
                style: const TextStyle(color: Colors.red),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDegreeItem(BuildContext context, WidgetRef ref, Degree degree) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: 0,
      color: Colors.grey.shade50,
      child: ListTile(
        title: Text(
          '${degree.code} (${degree.name})',
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        subtitle: degree.description != null
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    degree.description!,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondaryColor,
                    ),
                  ),
                  Text(
                    degree.level!.toUpperCase(),
                    style: const TextStyle(fontSize: 12),
                  ),
                ],
              )
            : null,
        trailing: IconButton(
          icon: const Icon(
            Icons.remove_red_eye_outlined,
            size: 20,
            color: Colors.grey,
          ),
          onPressed: () => _showDegreeDialog(context, ref, degree),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }

  Future<void> _showDegreeDialog(
    BuildContext context,
    WidgetRef ref,
    Degree? degree,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => DegreeDialog(degree: degree),
    );

    if (result == true && context.mounted) {
      ref.invalidate(degreesNotifierProvider);
    }
  }
}
