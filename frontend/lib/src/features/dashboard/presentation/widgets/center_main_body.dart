import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/books/presentation/widgets/build_book_card.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart'
    as model;
import 'package:management_side/src/features/books/presentation/screens/book_details_screen.dart';
import 'package:management_side/src/features/dashboard/presentation/providers/dashboard_summary_provider.dart';

class CenterMainBodyWidget extends ConsumerStatefulWidget {
  const CenterMainBodyWidget({super.key});

  @override
  ConsumerState<CenterMainBodyWidget> createState() =>
      _CenterMainBodyWidgetState();
}

class _CenterMainBodyWidgetState extends ConsumerState<CenterMainBodyWidget> {
  int _selectedFilter = 0;

  Widget _buildBookGrid(List<model.BookModel> books) {
    return books.isEmpty
        ? const Center(child: Text('No books found'))
        : GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 5,
              crossAxisSpacing: 20,
              mainAxisSpacing: 20,
              childAspectRatio: 0.7,
            ),
            itemCount: books.length,
            itemBuilder: (context, index) => buildBookCard(
              books[index],
              onTap: () {
                showBookDetailsDialog(
                  context: context,
                  bookId: books[index].id!,
                );
              },
            ),
          );
  }

  Widget _buildFilterButton(String text, int index) {
    final isSelected = _selectedFilter == index;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedFilter = index;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppTheme.primaryColor : const Color(0xFFD0D5DD),
          ),
        ),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: isSelected ? Colors.white : const Color(0xFF344054),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final recentlyAddedBooks = ref.watch(recentBooksProvider);
    final topRatedBooks = ref.watch(topRatedBooksProvider);
    final mostBorrowedBooks = ref.watch(mostBorrowedBooksProvider);
    final dashboardStats = ref.watch(dashboardSummaryStatsProvider);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats Cards
          Row(
            children: [
              _buildStatCard(
                'Total Books',
                dashboardStats.totalBooks.toString(),
                Icons.menu_book,
                const Color(0xFFF0F9FF),
                const Color(0xFF026AA2),
              ),
              const SizedBox(width: 16),
              _buildStatCard(
                'Total Users',
                dashboardStats.totalUsers.toString(),
                Icons.people,
                const Color(0xFFF0FDF4),
                const Color(0xFF15803D),
              ),
              const SizedBox(width: 16),
              _buildStatCard(
                'Issued Books',
                dashboardStats.activeLoans.toString(),
                Icons.bookmark,
                const Color(0xFFFFF7ED),
                const Color(0xFF9A3412),
              ),
              const SizedBox(width: 16),
              _buildStatCard(
                'Overdues',
                dashboardStats.overdueLoans.toString(),
                Icons.inventory_2,
                const Color(0xFFF5F3FF),
                const Color(0xFF5B21B6),
              ),
            ],
          ),

          const SizedBox(height: 32),

          // Books Section
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Title and Filter Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'BOOKS',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF344054),
                      letterSpacing: 0.5,
                    ),
                  ),
                  Row(
                    children: [
                      _buildFilterButton('Recently Added', 0),
                      const SizedBox(width: 12),
                      _buildFilterButton('Top Rated', 1),
                      const SizedBox(width: 12),
                      _buildFilterButton('Most Borrowed', 2),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Books Grid
              _buildBookGrid(
                _selectedFilter == 0
                    ? recentlyAddedBooks
                    : _selectedFilter == 1
                    ? topRatedBooks
                    : mostBorrowedBooks,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color bgColor,
    Color iconColor,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFEAECF0)),
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF101828),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF667085),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
