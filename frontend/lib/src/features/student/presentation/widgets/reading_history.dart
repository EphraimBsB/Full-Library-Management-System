import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/core/utils/responsive_utils.dart';
import 'package:management_side/src/features/books/domain/models/inhouse_usage_model.dart';
import 'package:management_side/src/features/books/presentation/providers/book_list_providers.dart';
import 'package:management_side/src/features/dashboard/presentation/widgets/right_side_bar.dart';

class ReadingHistoryList extends ConsumerWidget {
  const ReadingHistoryList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inHouseReadingsHistory = ref.watch(historyInhouseUsagesProvider);
    return Padding(
      padding: ResponsiveUtils.getPagePadding(context),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: InhouseUsageStatus.values.map((status) {
              final isSelected = ref.read(selectedStatus) == status;

              return FilterChip(
                label: Text(
                  status.name.toUpperCase(),
                  style: TextStyle(
                    color: isSelected ? AppTheme.surfaceColor : null,
                  ),
                ),
                labelStyle: const TextStyle(fontSize: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                  side: const BorderSide(color: Color(0xFFEAECF0), width: 1),
                ),
                selected: isSelected,
                selectedColor: AppTheme.primaryColor,
                checkmarkColor: AppTheme.surfaceColor,
                showCheckmark: true,
                iconTheme: const IconThemeData(size: 14),
                onSelected: (selected) {
                  ref.read(selectedStatus.notifier).state = (selected
                      ? status
                      : null)!;
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 8),
          inHouseReadingsHistory.when(
            data: (inHouseReadingsHistory) {
              if (inHouseReadingsHistory.items.isEmpty) {
                final status = ref.read(selectedStatus);
                String message;
                String subMessage;

                switch (status) {
                  case InhouseUsageStatus.active:
                    message = 'No active readings';
                    subMessage =
                        'You currently have no active reading sessions';
                    break;
                  case InhouseUsageStatus.completed:
                    message = 'No completed readings';
                    subMessage =
                        'Your completed reading history will appear here';
                    break;
                  case InhouseUsageStatus.force_ended:
                    message = 'No force-ended sessions';
                    subMessage = 'No reading sessions have been force-ended';
                    break;
                  default:
                    message = 'No reading history found';
                    subMessage = 'Your reading history will appear here';
                }

                return Expanded(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.menu_book_outlined,
                          size: 24,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          message,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          subMessage,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                        const SizedBox(height: 24),
                        if (status == InhouseUsageStatus.active)
                          ElevatedButton.icon(
                            onPressed: () {
                              // Navigate to books screen or refresh
                              context.go('/');
                            },
                            icon: const Icon(Icons.menu_book, size: 12),
                            label: const Text(
                              'Browse Books',
                              style: TextStyle(fontSize: 12),
                            ),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 12,
                              ),
                              backgroundColor: AppTheme.surfaceColor,
                              foregroundColor: AppTheme.primaryColor,
                            ),
                          )
                        else
                          TextButton.icon(
                            onPressed: () {
                              ref.invalidate(historyInhouseUsagesProvider);
                            },
                            icon: const Icon(Icons.refresh, size: 12),
                            label: const Text('Refresh'),
                          ),
                      ],
                    ),
                  ),
                );
              }
              return GridView.builder(
                shrinkWrap: true,
                // physics: const NeverScrollableScrollPhysics(),
                itemCount: inHouseReadingsHistory.items.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 5,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 2,
                ),
                itemBuilder: (context, index) {
                  final inhouseUsage = inHouseReadingsHistory.items[index];

                  return GestureDetector(
                    onTap: () async {},
                    child: Card(
                      color: AppTheme.backgroundColor,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Stack(
                          children: [
                            // Book info row
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Book cover with network image and fallback
                                Container(
                                  width: 83,
                                  height: 124,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF2F4F7),
                                    borderRadius: BorderRadius.circular(2),
                                    image: const DecorationImage(
                                      image: AssetImage(
                                        'assets/default_book.jpg',
                                      ),
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(2),
                                    child: CachedNetworkImage(
                                      imageUrl:
                                          inhouseUsage
                                              .copy['book']['coverImageUrl'] ??
                                          'assets/default_book.jpg',
                                      fit: BoxFit.cover,
                                      errorWidget:
                                          (context, error, stackTrace) =>
                                              const SizedBox.shrink(),
                                      placeholder: (context, url) =>
                                          const Center(
                                            child: SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                valueColor:
                                                    AlwaysStoppedAnimation<
                                                      Color
                                                    >(Color(0xFF7F56D9)),
                                              ),
                                            ),
                                          ),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                // Book details
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        inhouseUsage.copy['book']['title'] ??
                                            'Unknown Title',
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.black,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Book Copy Number: ${inhouseUsage.copy['accessNumber']}',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w500,
                                          color: AppTheme.textSecondaryColor,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Reader: ${inhouseUsage.user.firstName} ${inhouseUsage.user.lastName}',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: AppTheme.textSecondaryColor,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      // Due date
                                      Text(
                                        'Since: ${formatToTime(inhouseUsage.startedAt)}',
                                        style: const TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: AppTheme.secondaryColor,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      if (inhouseUsage.endedAt != null)
                                        Text(
                                          'Ended: ${formatToTime(inhouseUsage.endedAt!)}',
                                          style: const TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.textSecondaryColor,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            // Status badge
                            Positioned(
                              top:
                                  inhouseUsage.status ==
                                      InhouseUsageStatus.active
                                  ? 0
                                  : null,
                              bottom:
                                  inhouseUsage.status ==
                                      InhouseUsageStatus.active
                                  ? null
                                  : 0,
                              right: 0,
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: _getStatusColors(
                                    inhouseUsage.status,
                                  ).key,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: _getStatusColors(
                                      inhouseUsage.status,
                                    ).value,
                                  ),
                                ),
                                child: Text(
                                  inhouseUsage.status.name.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: _getStatusColors(
                                      inhouseUsage.status,
                                    ).value,
                                  ),
                                ),
                              ),
                            ),

                            // Force end button
                            if (inhouseUsage.status ==
                                InhouseUsageStatus.active)
                              Positioned(
                                bottom: 0,
                                right: 0,
                                child: InkWell(
                                  onTap: () async {
                                    final confirmed = await showDialog<bool>(
                                      context: context,
                                      builder: (context) => AlertDialog(
                                        title: const Text(
                                          'Confirm Reading Completion',
                                        ),
                                        content: Text(
                                          'Are you sure you want to finish the session for ${inhouseUsage.copy['book']['title']}?',
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.pop(context, false),
                                            child: const Text('Cancel'),
                                          ),
                                          TextButton(
                                            onPressed: () =>
                                                Navigator.pop(context, true),
                                            style: TextButton.styleFrom(
                                              foregroundColor:
                                                  AppTheme.successColor,
                                            ),
                                            child: const Text('Finish Reading'),
                                          ),
                                        ],
                                      ),
                                    );

                                    if (confirmed != true) return;

                                    final result = ref.read(
                                      endInhouseUsageProvider(inhouseUsage.id),
                                    );

                                    result.when(
                                      data: (data) {
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              'The session for ${inhouseUsage.copy['book']['title']} has been finished successfully, \nPlease make sure book is returned on the shelf or on librarian desk',
                                            ),
                                            backgroundColor: Colors.green,
                                          ),
                                        );
                                        ref.invalidate(inhouseUsagesProvider);
                                      },
                                      error: (error, stackTrace) {
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          SnackBar(
                                            content: Text(
                                              'Error: ${error.toString()}',
                                            ),
                                            backgroundColor: Colors.red,
                                          ),
                                        );
                                      },
                                      loading: () {
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          const SnackBar(
                                            content: Text('Ending session...'),
                                            backgroundColor: Colors.blue,
                                          ),
                                        );
                                      },
                                    );
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppTheme.successColor,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'Finish Reading',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w500,
                                        color: AppTheme.surfaceColor,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              );
            },
            error: (error, stackTrace) {
              return const Center(
                child: Text(
                  'Error loading in-house readings',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textSecondaryColor,
                  ),
                ),
              );
            },
            loading: () {
              return const Center(child: CircularProgressIndicator());
            },
          ),
        ],
      ),
    );
  }
}

MapEntry<Color, Color> _getStatusColors(InhouseUsageStatus status) {
  switch (status) {
    case InhouseUsageStatus.active:
      return const MapEntry(
        Color(0xFFECFDF3), // background
        Color(0xFF027A48), // text
      );
    case InhouseUsageStatus.completed:
      return const MapEntry(
        Color(0xFFEEF4FF), // background
        Color(0xFF004EEB), // text
      );
    case InhouseUsageStatus.force_ended:
      return const MapEntry(
        Color(0xFFFEF3F2), // background
        Color(0xFFB42318), // text
      );
  }
}
