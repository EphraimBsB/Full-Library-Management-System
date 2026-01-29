import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/settings/modules/book_sources/domain/models/source_model.dart';
import 'package:management_side/src/features/settings/modules/book_sources/presentation/providers/source_providers.dart';

class SourceDialog extends ConsumerStatefulWidget {
  final Source? source;

  const SourceDialog({super.key, this.source});

  @override
  ConsumerState<SourceDialog> createState() => _SourceDialogState();
}

class _SourceDialogState extends ConsumerState<SourceDialog> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _supplierController;
  late bool _isActive;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.source?.name ?? '');
    _supplierController = TextEditingController(
      text: widget.source?.supplier ?? '',
    );
    _isActive = widget.source?.isActive ?? true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _supplierController.dispose();
    super.dispose();
  }

  Future<void> _saveSource() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final source = Source(
        id: widget.source?.id ?? 0,
        name: _nameController.text.trim(),
        supplier: _supplierController.text.trim().isEmpty
            ? null
            : _supplierController.text.trim(),
        dateAcquired: DateTime.now().toString(),
        isActive: _isActive,
      );

      final notifier = ref.read(sourcesNotifierProvider.notifier);

      if (widget.source == null) {
        await notifier.addSource(source);
      } else {
        await notifier.updateSource(source);
      }

      if (mounted) {
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Failed to save source: $e',
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

  Future<void> _handleDelete() async {
    if (widget.source == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Source'),
        content: const Text(
          'Are you sure you want to delete this source? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('CANCEL'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('DELETE'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      setState(() => _isLoading = true);

      try {
        final notifier = ref.read(sourcesNotifierProvider.notifier);
        final sourceId = widget.source!.id;
        if (sourceId == null) return;

        await notifier.deleteSource(sourceId);

        if (mounted) {
          Navigator.of(context).pop(true);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Source deleted successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Failed to delete source: $e',
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
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            widget.source == null ? 'Add Source' : 'Edit Source',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          if (widget.source != null)
            IconButton(
              onPressed: _isLoading ? null : _handleDelete,
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
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.textSecondaryColor),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.textSecondaryColor),
                  ),
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
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.textSecondaryColor),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.textSecondaryColor),
                  ),
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
          onPressed: _isLoading ? null : _saveSource,
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
