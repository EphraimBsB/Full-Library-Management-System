import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';
import 'package:management_side/src/features/settings/modules/book_types/presentation/providers/book/book_type_providers.dart';
import 'package:management_side/src/features/settings/modules/book_types/presentation/screens/book_type_dialog.dart';
import 'package:management_side/src/features/settings/presentation/widgets/build_expandable_items.dart';

class BookTypesExpanded extends ConsumerWidget {
  const BookTypesExpanded({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookTypesAsync = ref.watch(bookTypesNotifierProvider);

    return buildExpandableSettingItem(
      icon: Icons.type_specimen,
      title: 'Book Book Types',
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add BookType'),
              onPressed: () => _showBookTypeDialog(context, ref, null),
            ),
          ),
          const SizedBox(height: 8),
          bookTypesAsync.when(
            data: (bookTypes) => bookTypes.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No BookTypes found'),
                  )
                : ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: bookTypes.length,
                    itemBuilder: (context, index) {
                      final bookType = bookTypes[index];
                      return _buildBookTypeItem(context, ref, bookType);
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

  Widget _buildBookTypeItem(
    BuildContext context,
    WidgetRef ref,
    BookType bookType,
  ) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: 0,
      color: Colors.grey.shade50,
      child: ListTile(
        title: Text(
          bookType.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        subtitle: bookType.description != null
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    bookType.description!,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondaryColor,
                    ),
                  ),
                  Text(
                    bookType.format!.toUpperCase(),
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
          onPressed: () => _showBookTypeDialog(context, ref, bookType),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }

  Future<void> _showBookTypeDialog(
    BuildContext context,
    WidgetRef ref,
    BookType? bookType,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => BookTypeDialog(bookType: bookType),
    );

    if (result == true && context.mounted) {
      ref.invalidate(bookTypesNotifierProvider);
    }
  }
}
