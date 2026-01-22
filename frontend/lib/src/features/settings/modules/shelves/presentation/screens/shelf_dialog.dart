import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/settings/modules/locations/domain/models/location_model.dart';
import 'package:management_side/src/features/settings/modules/locations/presentation/providers/location_providers.dart';
import 'package:management_side/src/features/settings/modules/shelves/domain/models/shelf_model.dart';
import 'package:management_side/src/features/settings/modules/shelves/presentation/providers/shelf_providers.dart';

class ShelfDialog extends ConsumerStatefulWidget {
  final Shelf? shelf;

  const ShelfDialog({super.key, this.shelf});

  @override
  ConsumerState<ShelfDialog> createState() => _ShelfDialogState();
}

class _ShelfDialogState extends ConsumerState<ShelfDialog> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late bool _isActive;
  int? _locationId;

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.shelf?.name ?? '');
    _descriptionController = TextEditingController(
      text: widget.shelf?.description ?? '',
    );
    _isActive = widget.shelf?.isActive ?? true;
    _locationId = widget.shelf?.locationId;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_locationId == null) return;

    setState(() => _isLoading = true);

    try {
      final shelf = Shelf(
        id: widget.shelf?.id ?? 0,
        name: _nameController.text.trim(),
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        locationId: _locationId!,
        isActive: _isActive,
      );

      final notifier = ref.read(shelvesNotifierProvider.notifier);

      if (widget.shelf == null) {
        await notifier.addShelf(shelf);
      } else {
        await notifier.updateShelf(shelf);
      }

      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save shelf: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final locationsAsync = ref.watch(locationsNotifierProvider);

    return AlertDialog(
      title: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            widget.shelf == null ? 'Add Shelf' : 'Edit Shelf',
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
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.textSecondaryColor),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.textSecondaryColor),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Please enter a name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description (Optional)',
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
              locationsAsync.when(
                data: (locations) {
                  final activeLocations = locations
                      .where((l) => l.isActive)
                      .toList();

                  int? selected = _locationId;
                  if (selected == null && activeLocations.isNotEmpty) {
                    selected = activeLocations.first.id;
                  }

                  return DropdownButtonFormField<int>(
                    value: selected,
                    decoration: const InputDecoration(
                      labelText: 'Location',
                      border: OutlineInputBorder(),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: AppTheme.textSecondaryColor,
                        ),
                      ),
                    ),
                    items: activeLocations
                        .where((l) => l.id != null)
                        .map(
                          (Location l) => DropdownMenuItem<int>(
                            value: l.id,
                            child: Text(l.name),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setState(() => _locationId = value),
                    validator: (value) {
                      if (value == null) {
                        return 'Please select a location';
                      }
                      return null;
                    },
                  );
                },
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(8.0),
                    child: CircularProgressIndicator(),
                  ),
                ),
                error: (error, stack) => Text(
                  'Failed to load locations: $error',
                  style: const TextStyle(color: Colors.red),
                ),
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
          onPressed: _isLoading ? null : _save,
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
