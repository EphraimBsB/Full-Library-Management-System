import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/models/source_model.dart';
import 'package:management_side/src/features/settings/modules/book_sources/presentation/providers/source_providers.dart';
import 'package:management_side/src/features/settings/modules/book_sources/presentation/screens/source_dialog.dart';
import 'package:management_side/src/features/settings/presentation/widgets/build_expandable_items.dart';

class SourcesExpanded extends ConsumerWidget {
  const SourcesExpanded({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sourcesAsync = ref.watch(sourcesNotifierProvider);

    return buildExpandableSettingItem(
      icon: Icons.source,
      title: 'Book Sources',
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add Source'),
              onPressed: () => _showSourceDialog(context, ref, null),
            ),
          ),
          const SizedBox(height: 8),
          sourcesAsync.when(
            data: (sources) => sources.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No sources found'),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: sources.length,
                    itemBuilder: (context, index) {
                      final source = sources[index];
                      return _buildSourceItem(context, ref, source);
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

  Widget _buildSourceItem(BuildContext context, WidgetRef ref, Source source) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: 0,
      color: Colors.grey.shade50,
      child: ListTile(
        title: Text(
          source.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        subtitle: source.supplier != null
            ? Text(
                'Supplier: ${source.supplier!}',
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
          onPressed: () => _showSourceDialog(context, ref, source),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }

  Future<void> _showSourceDialog(
    BuildContext context,
    WidgetRef ref,
    Source? source,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => SourceDialog(source: source),
    );

    if (result == true && context.mounted) {
      ref.invalidate(sourcesNotifierProvider);
    }
  }
}
