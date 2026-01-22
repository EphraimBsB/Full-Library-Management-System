import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/publishers/domain/models/publisher_model.dart';
import 'package:management_side/src/features/settings/modules/publishers/presentation/providers/publisher_providers.dart';
import 'package:management_side/src/features/settings/modules/publishers/presentation/screens/publisher_dialog.dart';
import 'package:management_side/src/features/settings/presentation/widgets/build_expandable_items.dart';

class PublishersExpanded extends ConsumerWidget {
  const PublishersExpanded({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final publishersAsync = ref.watch(publishersNotifierProvider);

    return buildExpandableSettingItem(
      icon: Icons.business,
      title: 'Publishers',
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add Publisher'),
              onPressed: () => _showPublisherDialog(context, ref, null),
            ),
          ),
          const SizedBox(height: 8),
          publishersAsync.when(
            data: (publishers) => publishers.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No publishers found'),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: publishers.length,
                    itemBuilder: (context, index) {
                      final publisher = publishers[index];
                      return _buildPublisherItem(context, ref, publisher);
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
              child: Text('Error loading publishers: $error'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPublisherItem(
    BuildContext context,
    WidgetRef ref,
    Publisher publisher,
  ) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: 0,
      color: Colors.grey.shade50,
      child: ListTile(
        title: Text(
          publisher.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        subtitle: publisher.description != null
            ? Text(
                publisher.description!,
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
          onPressed: () => _showPublisherDialog(context, ref, publisher),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }

  Future<void> _showPublisherDialog(
    BuildContext context,
    WidgetRef ref,
    Publisher? publisher,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => PublisherDialog(publisher: publisher),
    );

    if (result == true && context.mounted) {
      ref.invalidate(publishersNotifierProvider);
    }
  }
}
