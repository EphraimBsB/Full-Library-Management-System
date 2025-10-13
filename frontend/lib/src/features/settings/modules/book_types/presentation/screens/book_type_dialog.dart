import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/settings/modules/book_types/domain/models/book_type_model.dart';
import 'package:management_side/src/features/settings/modules/book_types/presentation/providers/book/book_type_providers.dart';

class BookTypeDialog extends ConsumerStatefulWidget {
  final BookType? bookType;

  const BookTypeDialog({super.key, this.bookType});

  @override
  ConsumerState<BookTypeDialog> createState() => _BookTypeDialogState();
}

class _BookTypeDialogState extends ConsumerState<BookTypeDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _supplierController;
  late bool _isActive;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.bookType?.name ?? '');
    _supplierController = TextEditingController(
      text: widget.bookType?.description ?? '',
    );
    _isActive = widget.bookType?.isActive ?? true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _supplierController.dispose();
    super.dispose();
  }

  Future<void> _saveBookType() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final bookType = BookType(
        id: widget.bookType?.id ?? 0,
        name: _nameController.text.trim(),
        description: _supplierController.text.trim().isEmpty
            ? null
            : _supplierController.text.trim(),
        format: '',
        isActive: _isActive,
      );

      final notifier = ref.read(bookTypesNotifierProvider.notifier);

      if (widget.bookType == null) {
        await notifier.addBookType(bookType);
      } else {
        await notifier.updateBookType(bookType);
      }

      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to save Book Type: $e',
              style: const TextStyle(color: Colors.white),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            widget.bookType == null ? 'Add Book Type' : 'Edit Book Type',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          IconButton(
            onPressed: () {},
            icon: Icon(Icons.delete, color: AppTheme.accentColor),
          ),
        ],
      ),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(
                  labelText: 'Name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter a name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _supplierController,
                decoration: const InputDecoration(
                  labelText: 'Supplier',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text('Active'),
                value: _isActive,
                onChanged: (value) => setState(() => _isActive = value),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
          child: const Text('CANCEL'),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _saveBookType,
          child: _isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              : const Text('SAVE'),
        ),
      ],
    );
  }
}
