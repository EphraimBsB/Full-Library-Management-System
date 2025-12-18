import 'package:flutter/material.dart';
import 'package:management_side/src/core/data/base_repository.dart';

/// A numbered pagination widget that allows users to navigate between pages
class NumberedPaginationWidget<T> extends StatelessWidget {
  final PaginatedResponse<T> data;
  final Function(int) onPageChanged;
  final int maxVisiblePages;
  final Color? activeColor;
  final Color? inactiveColor;
  final double? height;
  final EdgeInsets? padding;
  final bool showFirstLast;
  final bool showPrevNext;

  const NumberedPaginationWidget({
    super.key,
    required this.data,
    required this.onPageChanged,
    this.maxVisiblePages = 7,
    this.activeColor,
    this.inactiveColor,
    this.height = 48,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    this.showFirstLast = true,
    this.showPrevNext = true,
  });

  @override
  Widget build(BuildContext context) {
    if (data.totalPages <= 1) {
      return const SizedBox.shrink();
    }

    final theme = Theme.of(context);
    final activePageColor = activeColor ?? theme.primaryColor;
    final inactivePageColor = inactiveColor ?? Colors.grey.shade300;

    return Container(
      height: height,
      padding: padding,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // First page button
          if (showFirstLast && data.totalPages > maxVisiblePages)
            _buildPageButton(
              context: context,
              pageNumber: 1,
              isActive: false,
              label: 'First',
              color: inactivePageColor,
              onTap: data.currentPage > 1 ? () => onPageChanged(1) : null,
            ),

          // Previous page button
          if (showPrevNext)
            _buildPageButton(
              context: context,
              pageNumber: data.currentPage - 1,
              isActive: false,
              label: 'Prev',
              color: inactivePageColor,
              onTap: data.currentPage > 1
                  ? () => onPageChanged(data.currentPage - 1)
                  : null,
            ),

          const SizedBox(width: 8),

          // Page numbers
          ..._buildPageNumbers(context, activePageColor, inactivePageColor),

          const SizedBox(width: 8),

          // Next page button
          if (showPrevNext)
            _buildPageButton(
              context: context,
              pageNumber: data.currentPage + 1,
              isActive: false,
              label: 'Next',
              color: inactivePageColor,
              onTap: data.currentPage < data.totalPages
                  ? () => onPageChanged(data.currentPage + 1)
                  : null,
            ),

          // Last page button
          if (showFirstLast && data.totalPages > maxVisiblePages)
            _buildPageButton(
              context: context,
              pageNumber: data.totalPages,
              isActive: false,
              label: 'Last',
              color: inactivePageColor,
              onTap: data.currentPage < data.totalPages
                  ? () => onPageChanged(data.totalPages)
                  : null,
            ),
        ],
      ),
    );
  }

  List<Widget> _buildPageNumbers(
    BuildContext context,
    Color activeColor,
    Color inactiveColor,
  ) {
    final List<Widget> pageButtons = [];
    final int currentPage = data.currentPage;
    final int totalPages = data.totalPages;

    // Calculate the range of page numbers to show
    int startPage = 1;
    int endPage = totalPages;

    if (totalPages > maxVisiblePages) {
      final int halfVisible = (maxVisiblePages - 1) ~/ 2;

      if (currentPage <= halfVisible + 1) {
        endPage = maxVisiblePages;
      } else if (currentPage >= totalPages - halfVisible) {
        startPage = totalPages - maxVisiblePages + 1;
      } else {
        startPage = currentPage - halfVisible;
        endPage = currentPage + halfVisible;
      }
    }

    // Add first page and ellipsis if needed
    if (startPage > 1) {
      pageButtons.add(
        _buildPageButton(
          context: context,
          pageNumber: 1,
          isActive: currentPage == 1,
          color: currentPage == 1 ? activeColor : inactiveColor,
          onTap: currentPage != 1 ? () => onPageChanged(1) : null,
        ),
      );

      if (startPage > 2) {
        pageButtons.add(_buildEllipsis(context, inactiveColor));
      }
    }

    // Add page numbers in the calculated range
    for (int i = startPage; i <= endPage; i++) {
      pageButtons.add(
        _buildPageButton(
          context: context,
          pageNumber: i,
          isActive: i == currentPage,
          color: i == currentPage ? activeColor : inactiveColor,
          onTap: i != currentPage ? () => onPageChanged(i) : null,
        ),
      );
    }

    // Add ellipsis and last page if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageButtons.add(_buildEllipsis(context, inactiveColor));
      }

      pageButtons.add(
        _buildPageButton(
          context: context,
          pageNumber: totalPages,
          isActive: currentPage == totalPages,
          color: currentPage == totalPages ? activeColor : inactiveColor,
          onTap: currentPage != totalPages
              ? () => onPageChanged(totalPages)
              : null,
        ),
      );
    }

    return pageButtons;
  }

  Widget _buildPageButton({
    required BuildContext context,
    required int pageNumber,
    required bool isActive,
    required Color color,
    String? label,
    VoidCallback? onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Material(
        color: isActive ? color : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              border: Border.all(
                color: isActive ? color : color.withOpacity(0.5),
                width: 1,
              ),
              borderRadius: BorderRadius.circular(8),
              color: isActive ? color : Colors.transparent,
            ),
            child: Center(
              child: Text(
                label ?? pageNumber.toString(),
                style: TextStyle(
                  color: isActive ? Colors.white : color,
                  fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEllipsis(BuildContext context, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Container(
        width: 40,
        height: 40,
        child: Center(
          child: Text(
            '...',
            style: TextStyle(
              color: color,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }
}
