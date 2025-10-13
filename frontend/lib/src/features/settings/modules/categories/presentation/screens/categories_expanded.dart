import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/categories/domain/models/category_model.dart';
import 'package:management_side/src/features/settings/modules/categories/presentation/providers/category_providers.dart';
import 'package:management_side/src/features/settings/modules/categories/presentation/screens/categories_dialog.dart';
import 'package:management_side/src/features/settings/presentation/widgets/build_expandable_items.dart';

class CategoriesExpanded extends ConsumerWidget {
  const CategoriesExpanded({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categoriesAsync = ref.watch(categoriesNotifierProvider);

    return buildExpandableSettingItem(
      icon: Icons.category,
      title: 'Book Categories',
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add Category'),
              onPressed: () => _showCategoryDialog(context, ref, null),
            ),
          ),
          const SizedBox(height: 8),
          categoriesAsync.when(
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
                      final category = categories[index];
                      return _buildCategoryItem(context, ref, category);
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

  Widget _buildCategoryItem(
    BuildContext context,
    WidgetRef ref,
    Category category,
  ) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: 0,
      color: Colors.grey.shade50,
      child: ListTile(
        title: Text(
          category.name,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        ),
        subtitle: category.description != null
            ? Text(
                category.description!,
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
          onPressed: () => _showCategoryDialog(context, ref, category),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      ),
    );
  }

  Future<void> _showCategoryDialog(
    BuildContext context,
    WidgetRef ref,
    Category? category,
  ) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => CategoryDialog(category: category),
    );

    if (result == true && context.mounted) {
      ref.invalidate(categoriesNotifierProvider);
    }
  }
}
