import 'package:flutter/material.dart';

buildMediaInput({
  required TextEditingController controller,
  required String hintText,
  String? Function(String?)? validator,
  required void Function() onPickAndUpload,
}) {
  return TextFormField(
    controller: controller,
    decoration: InputDecoration(
      hintText: hintText,
      isDense: true,
      // contentPadding: const EdgeInsets.all(12),
      suffixIcon: IconButton(
        icon: const Icon(Icons.upload_file),
        onPressed: onPickAndUpload,
        tooltip: 'Upload file',
      ),
      border: const OutlineInputBorder(
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      enabledBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: Colors.grey),
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      focusedBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: Colors.blue, width: 2),
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      filled: true,
      fillColor: Colors.grey[50],
      errorStyle: const TextStyle(fontSize: 12),
      errorMaxLines: 2,
    ),
    validator: validator,
  );
}
