import 'package:flutter/material.dart';

class IssueBookDialog extends StatefulWidget {
  final List<String> availableAccessNumbers;
  final Function(String rollNumber, String accessNumber) onIssue;

  const IssueBookDialog({
    super.key,
    required this.availableAccessNumbers,
    required this.onIssue,
  });

  @override
  State<IssueBookDialog> createState() => _IssueBookDialogState();
}

class _IssueBookDialogState extends State<IssueBookDialog> {
  final _formKey = GlobalKey<FormState>();
  final _rollNumberController = TextEditingController();
  String? _selectedAccessNumber;

  @override
  void dispose() {
    _rollNumberController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Issue Book'),
      content: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _rollNumberController,
              decoration: const InputDecoration(
                labelText: 'Student Roll Number *',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter student roll number';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedAccessNumber,
              decoration: const InputDecoration(
                labelText: 'Access Number *',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem(
                  value: null,
                  child: Text('Select an access number'),
                ),
                ...widget.availableAccessNumbers.map((number) {
                  return DropdownMenuItem(
                    value: number,
                    child: Text(number),
                  );
                }).toList(),
              ],
              validator: (value) {
                if (value == null) {
                  return 'Please select an access number';
                }
                return null;
              },
              onChanged: (value) {
                setState(() {
                  _selectedAccessNumber = value;
                });
              },
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('CANCEL'),
        ),
        FilledButton(
          onPressed: () {
            if (_formKey.currentState?.validate() == true) {
              widget.onIssue(
                _rollNumberController.text.trim(),
                _selectedAccessNumber!,
              );
              if (mounted) {
                Navigator.of(context).pop();
              }
            }
          },
          child: const Text('ISSUE'),
        ),
      ],
    );
  }
}

void showIssueBookDialog({
  required BuildContext context,
  required List<String> availableAccessNumbers,
  required Function(String rollNumber, String accessNumber) onIssue,
}) {
  showDialog(
    context: context,
    builder: (context) => IssueBookDialog(
      availableAccessNumbers: availableAccessNumbers,
      onIssue: onIssue,
    ),
  );
}
