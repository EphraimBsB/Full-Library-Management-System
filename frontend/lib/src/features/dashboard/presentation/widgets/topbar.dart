import 'package:flutter/material.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/books/presentation/screens/book_form_dialog.dart';

class TopbarWidget extends StatefulWidget {
  const TopbarWidget({super.key});

  @override
  State<TopbarWidget> createState() => _TopbarWidgetState();
}

class _TopbarWidgetState extends State<TopbarWidget> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _handleAddBook() {
    showBookFormDialog(context: context);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 28),
      margin: const EdgeInsets.only(left: 5),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFEAECF0), width: 1)),
        borderRadius: BorderRadius.only(bottomLeft: Radius.circular(8.0)),
      ),
      child: Row(
        children: [
          // Search Bar
          Container(
            width: 700,
            // height: 55,
            decoration: BoxDecoration(
              color: const Color(0xFFF9FAFB),
              borderRadius: BorderRadius.circular(16),
            ),
            child: TextFormField(
              controller: _searchController,
              textAlignVertical: TextAlignVertical.center,
              style: const TextStyle(fontSize: 14, color: Color(0xFF101828)),
              decoration: InputDecoration(
                hintText: 'Search books, members, or transactions...',
                hintStyle: const TextStyle(
                  color: Color(0xFF98A2B3),
                  fontSize: 14,
                ),
                prefixIcon: const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Icon(Icons.search, size: 20, color: Color(0xFF98A2B3)),
                ),
                filled: true,
                fillColor: const Color(0xFFF9FAFB),
                contentPadding: EdgeInsets.zero,
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Color(0xFFD0D5DD)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(
                    color: Color(0xFFD0D5DD),
                    width: 1.5,
                  ),
                ),
              ),
            ),
          ),
          const Spacer(flex: 1),
          // Notification Icon
          Stack(
            alignment: Alignment.center,
            children: [
              const Icon(
                Icons.notifications_outlined,
                size: 28,
                color: Color(0xFF344054),
              ),
              Positioned(
                right: 2,
                top: 2,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppTheme.errorColor,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),
          // Add New Book Button
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 20),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(32),
              ),
              textStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            onPressed: _handleAddBook,
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.add_box_rounded, size: 24),
                SizedBox(width: 10),
                Text('Add new book'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
