import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/shelves/domain/models/shelf_model.dart';
import 'package:management_side/src/features/settings/modules/shelves/presentation/providers/shelf_providers.dart';
import 'package:management_side/src/features/settings/modules/shelves/presentation/screens/shelf_dialog.dart';
import 'package:management_side/src/features/settings/presentation/widgets/build_expandable_items.dart';

class ShelvesExpanded extends ConsumerWidget {
  const ShelvesExpanded({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shelvesAsync = ref.watch(shelvesNotifierProvider);

    return buildExpandableSettingItem(
      icon: Icons.storage,
      title: 'Shelves',
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add Shelf'),
              onPressed: () => _showShelfDialog(context, ref, null),
            ),
          ),
          const SizedBox(height: 8),
          shelvesAsync.when(
            data: (shelves) => shelves.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No shelves found'),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: shelves.length,
                    itemBuilder: (context, index) {
                      final shelf = shelves[index];
                      return _buildShelfItem(context, ref, shelf);
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
              child: Text('Error loading shelves: $error'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShelfItem(BuildContext context, WidgetRef ref, Shelf shelf) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: 0,
      color: Colors.grey.shade50,
      child: ListTile(
        title: Text(
          shelf.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        subtitle: shelf.location != null
            ? Text(
                'Location: ${shelf.location!.name}',
                style: const TextStyle(fontSize: 12),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              )
            : null,
        trailing: IconButton(
          icon: const Icon(
            Icons.remove_red_eye_outlined,
            size: 20,
            color: Colors.grey,
          ),
          onPressed: () => _showShelfDialog(context, ref, shelf),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }

  Future<void> _showShelfDialog(
    BuildContext context,
    WidgetRef ref,
    Shelf? shelf,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => ShelfDialog(shelf: shelf),
    );

    if (result == true && context.mounted) {
      ref.invalidate(shelvesNotifierProvider);
    }
  }
}
