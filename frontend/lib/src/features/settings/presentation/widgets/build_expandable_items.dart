import 'package:flutter/material.dart';
import 'package:management_side/src/core/theme/app_theme.dart';

Widget buildExpandableSettingItem({
  required IconData icon,
  required String title,
  required Widget child,
  bool initiallyExpanded = false,
}) {
  return Card(
    margin: const EdgeInsets.only(bottom: 8),
    color: AppTheme.surfaceColor,
    elevation: 0,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(8),
      side: BorderSide(color: Colors.grey.shade200),
    ),
    child: ExpansionTile(
      leading: Icon(icon, color: AppTheme.textPrimaryColor, size: 20),
      title: Text(
        title,
        style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13),
      ),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: child,
        ),
      ],
    ),
  );
}
