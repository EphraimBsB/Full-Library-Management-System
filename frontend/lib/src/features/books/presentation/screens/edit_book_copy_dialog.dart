import 'dart:developer' as dev;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/books/domain/models/book_copy.dart';
import 'package:management_side/src/features/books/data/api/book_api_service.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/features/books/presentation/providers/book_details_provider.dart';

class EditBookCopyDialog extends ConsumerStatefulWidget {
  final BookCopy copy;
  final int bookId;
  final VoidCallback? onCopyUpdated;

  const EditBookCopyDialog({
    super.key,
    required this.copy,
    required this.bookId,
    this.onCopyUpdated,
  });

  @override
  ConsumerState<EditBookCopyDialog> createState() => _EditBookCopyDialogState();
}

class _EditBookCopyDialogState extends ConsumerState<EditBookCopyDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _accessNumberController;
  late String _selectedStatus;
  late TextEditingController _notesController;
  bool _isLoading = false;

  final List<String> _statusOptions = [
    'AVAILABLE',
    'BORROWED',
    'LOST',
    'DAMAGED',
    'IN_REPAIR',
    'RESERVED',
  ];

  @override
  void initState() {
    super.initState();
    _accessNumberController = TextEditingController(
      text: widget.copy.accessNumber,
    );
    _selectedStatus = widget.copy.status;
    _notesController = TextEditingController(text: widget.copy.notes ?? '');
  }

  @override
  void dispose() {
    _accessNumberController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  String _formatStatus(String status) {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'BORROWED':
        return 'Borrowed';
      case 'LOST':
        return 'Lost';
      case 'DAMAGED':
        return 'Damaged';
      case 'IN_REPAIR':
        return 'In Repair';
      case 'RESERVED':
        return 'Reserved';
      default:
        return status;
    }
  }

  Future<void> _updateCopy() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final apiClient = ApiClient();
      final bookApiService = BookApiService(apiClient.dio);

      final copyData = {
        'accessNumber': _accessNumberController.text.trim(),
        'status': _selectedStatus,
        'notes': _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      };

      final result = await bookApiService.updateBookCopy(
        widget.bookId,
        widget.copy.id!,
        copyData,
      );

      if (mounted) {
        // Handle different response types
        bool success = false;
        String message = 'Unknown response';

        if (result is Map<String, dynamic>) {
          success = result['success'] == true;
          message = result['message'] ?? 'Unknown error';
        } else if (result is bool) {
          success = result;
          message = success
              ? 'Book copy updated successfully'
              : 'Failed to update copy';
        }

        if (success) {
          ref.invalidate(bookDetailsProvider(widget.bookId));
          Navigator.of(context).pop();
          widget.onCopyUpdated?.call();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Book copy updated successfully'),
              backgroundColor: Colors.green,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to update copy: $message'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      dev.log('Error updating copy: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error updating copy: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(Icons.edit_outlined, color: theme.primaryColor),
                const SizedBox(width: 12),
                Text(
                  'Edit Book Copy',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                  tooltip: 'Close',
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Form
            Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Access Number
                  TextFormField(
                    controller: _accessNumberController,
                    decoration: const InputDecoration(
                      labelText: 'Access Number',
                      hintText: 'Enter access number',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.tag),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Access number is required';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  // Status
                  DropdownButtonFormField<String>(
                    value: _selectedStatus,
                    initialValue: _selectedStatus,
                    decoration: const InputDecoration(
                      labelText: 'Status',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.info_outline),
                    ),
                    items: _statusOptions.map((status) {
                      return DropdownMenuItem<String>(
                        value: status,
                        child: Text(_formatStatus(status)),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedStatus = value!;
                      });
                    },
                  ),
                  const SizedBox(height: 16),

                  // Notes
                  TextFormField(
                    controller: _notesController,
                    decoration: const InputDecoration(
                      labelText: 'Notes (Optional)',
                      hintText: 'Enter any additional notes',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.note_outlined),
                    ),
                    maxLines: 3,
                  ),
                  const SizedBox(height: 24),

                  // Actions
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: _isLoading
                            ? null
                            : () => Navigator.of(context).pop(),
                        child: const Text('CANCEL'),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: _isLoading ? null : _updateCopy,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.primaryColor,
                          foregroundColor: Colors.white,
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white,
                                  ),
                                ),
                              )
                            : const Text('UPDATE COPY'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shows the edit book copy dialog
Future<void> showEditBookCopyDialog({
  required BuildContext context,
  required BookCopy copy,
  required int bookId,
  VoidCallback? onCopyUpdated,
}) {
  return showDialog(
    context: context,
    builder: (context) => EditBookCopyDialog(
      copy: copy,
      bookId: bookId,
      onCopyUpdated: onCopyUpdated,
    ),
  );
}
