import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/settings/modules/membership-types/domain/models/membership_type_model.dart';
import 'package:management_side/src/features/settings/modules/membership-types/presentation/providers/membership_types_providers.dart';

class MembershipTypeDialog extends ConsumerStatefulWidget {
  final MembershipType? membershipType;

  const MembershipTypeDialog({super.key, this.membershipType});

  @override
  ConsumerState<MembershipTypeDialog> createState() =>
      _MembershipTypeDialogState();
}

class _MembershipTypeDialogState extends ConsumerState<MembershipTypeDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _descriptionController;
  late TextEditingController _maxBooksController;
  late TextEditingController _maxDurationController;
  late TextEditingController _renewalLimitController;
  late TextEditingController _fineRateController;
  late bool _isActive;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(
      text: widget.membershipType?.name ?? '',
    );
    _descriptionController = TextEditingController(
      text: widget.membershipType?.description ?? '',
    );
    _maxBooksController = TextEditingController(
      text: widget.membershipType?.maxBooks.toString() ?? '3',
    );
    _maxDurationController = TextEditingController(
      text: widget.membershipType?.maxDurationDays.toString() ?? '14',
    );
    _renewalLimitController = TextEditingController(
      text: widget.membershipType?.renewalLimit.toString() ?? '1',
    );
    _fineRateController = TextEditingController(
      text: widget.membershipType?.fineRate ?? '0.00',
    );
    _isActive = widget.membershipType?.isActive ?? true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _maxBooksController.dispose();
    _maxDurationController.dispose();
    _renewalLimitController.dispose();
    _fineRateController.dispose();
    super.dispose();
  }

  Future<void> _saveMembershipType() async {
    if (!_formKey.currentState!.validate()) return;

    final membershipType = MembershipType(
      id: widget.membershipType?.id ?? 0,
      name: _nameController.text,
      description: _descriptionController.text.isEmpty
          ? null
          : _descriptionController.text,
      maxBooks: int.tryParse(_maxBooksController.text) ?? 3,
      maxDurationDays: int.tryParse(_maxDurationController.text) ?? 14,
      renewalLimit: int.tryParse(_renewalLimitController.text) ?? 1,
      fineRate: _fineRateController.text,
      isActive: _isActive,
    );

    try {
      final notifier = ref.read(membershipTypesNotifierProvider.notifier);

      if (widget.membershipType == null) {
        await notifier.addMembershipType(membershipType);
      } else {
        await notifier.updateMembershipType(membershipType);
      }

      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save membership type: $e'),
            backgroundColor: Colors.red,
          ),
        );
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
            widget.membershipType == null
                ? 'Add Membership Type'
                : 'Edit Membership Type',
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
            crossAxisAlignment: CrossAxisAlignment.start,
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
                controller: _descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description (Optional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _maxBooksController,
                      decoration: const InputDecoration(
                        labelText: 'Max Books',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        if (int.tryParse(value) == null) {
                          return 'Enter a valid number';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _maxDurationController,
                      decoration: const InputDecoration(
                        labelText: 'Max Days',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        if (int.tryParse(value) == null) {
                          return 'Enter a valid number';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _renewalLimitController,
                      decoration: const InputDecoration(
                        labelText: 'Renewal Limit',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: TextInputType.number,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        if (int.tryParse(value) == null) {
                          return 'Enter a valid number';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: TextFormField(
                      controller: _fineRateController,
                      decoration: const InputDecoration(
                        labelText: 'Fine Rate',
                        border: OutlineInputBorder(),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Required';
                        }
                        if (double.tryParse(value) == null) {
                          return 'Enter a valid amount';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
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
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('CANCEL'),
        ),
        ElevatedButton(
          onPressed: _saveMembershipType,
          child: const Text('SAVE'),
        ),
      ],
    );
  }
}
