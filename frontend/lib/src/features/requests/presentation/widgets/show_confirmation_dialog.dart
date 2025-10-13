import 'package:flutter/material.dart';
import 'package:management_side/src/core/theme/app_theme.dart';

Future<bool> showConfirmationDialog({
  required BuildContext context,
  required String title,
  required String content,
  required String confirmButtonText,
  Color? confirmButtonColor,
  String? notesHint,
  TextEditingController? notesController,
}) async {
  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: AppTheme.backgroundColor,
      title: Text(title),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(content),
            const SizedBox(height: 16),
            TextField(
              controller: notesController,
              decoration: InputDecoration(
                labelText: 'Notes (Optional)',
                hintText: notesHint,
                border: const OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          child: const Text('CANCEL'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.of(context).pop(true),
          style: confirmButtonColor != null
              ? ElevatedButton.styleFrom(backgroundColor: confirmButtonColor)
              : null,
          child: Text(confirmButtonText),
        ),
      ],
    ),
  );

  final result = confirmed == true;
  if (!result) {
    notesController?.clear();
  }
  return result;
}
