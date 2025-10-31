import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/books/domain/models/inhouse_usage_model.dart';
import 'package:management_side/src/features/books/presentation/providers/book_list_providers.dart';
import 'package:management_side/src/features/dashboard/presentation/providers/dashboard_summary_provider.dart';

class RightSideBarWidget extends ConsumerWidget {
  const RightSideBarWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inHouseReadings = ref.watch(inhouseUsagesProvider);
    final activeUsers = ref.watch(activeUsersProvider);

    return Container(
      width: 400,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(left: BorderSide(color: Color(0xFFEAECF0), width: 1)),
      ),
      margin: const EdgeInsets.only(top: 5),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Pending Loans Section
            const Text(
              'In Library Readings',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF101828),
              ),
            ),
            Divider(color: AppTheme.textSecondaryColor, thickness: 0.5),
            const SizedBox(height: 8),
            // status chips filters
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: InhouseUsageStatus.values.map((status) {
                final isSelected = ref.read(selectedStatus) == status;
                return FilterChip(
                  label: Text(
                    status.name.toUpperCase(),
                    style: TextStyle(
                      color: isSelected ? Theme.of(context).primaryColor : null,
                    ),
                  ),
                  labelStyle: const TextStyle(fontSize: 9),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: Color(0xFFEAECF0), width: 1),
                  ),
                  selected: isSelected,
                  selectedColor: Theme.of(
                    context,
                  ).primaryColor.withValues(alpha: 0.1),
                  checkmarkColor: Theme.of(context).primaryColor,
                  showCheckmark: true,
                  iconTheme: const IconThemeData(size: 12),
                  onSelected: (selected) {
                    ref.read(selectedStatus.notifier).state = (selected
                        ? status
                        : null)!;
                  },
                );
              }).toList(),
            ),
            const SizedBox(height: 8),

            inHouseReadings.when(
              data: (inHouseReadings) {
                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: inHouseReadings.items.length,
                  separatorBuilder: (context, index) => const SizedBox.shrink(),
                  itemBuilder: (context, index) {
                    final inhouseUsage = inHouseReadings.items[index];

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
                                    width: 58,
                                    height: 83,
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
                                              color:
                                                  AppTheme.textSecondaryColor,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              // Status badge
                              Positioned(
                                top: 0,
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
                                    onTap: () {
                                      final result = ref.read(
                                        forceEndInhouseUsageProvider(
                                          inhouseUsage.id,
                                        ),
                                      );
                                      result.when(
                                        data: (data) {
                                          //Show snackbar
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            SnackBar(
                                              content: Text(
                                                'The session for ${inhouseUsage.copy['book']['title']} has been ended successfully',
                                              ),
                                            ),
                                          );
                                        },
                                        error: (error, stackTrace) {
                                          //Show snackbar
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            SnackBar(
                                              content: Text(
                                                'Error: ${error.toString()}',
                                              ),
                                            ),
                                          );
                                        },
                                        loading: () {
                                          //Show snackbar
                                          ScaffoldMessenger.of(
                                            context,
                                          ).showSnackBar(
                                            SnackBar(
                                              content: Text('Loading...'),
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
                                        color: AppTheme.primaryColor,
                                        borderRadius: BorderRadius.circular(2),
                                      ),
                                      child: Text(
                                        'Force End',
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

            const SizedBox(height: 24),

            // Most Active Section
            const Text(
              'Most Active Members',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF101828),
              ),
            ),
            Divider(color: AppTheme.textSecondaryColor, thickness: 0.5),
            const SizedBox(height: 16),

            // Active Users List
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: activeUsers.length,
              itemBuilder: (context, index) {
                final user = activeUsers[index];

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    children: [
                      // User avatar
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: const Color(0xFFF2F4F7),
                        backgroundImage: const AssetImage(
                          'assets/default_avatar.png',
                        ),
                        // child: Text(
                        //   user.firstName[0],
                        //   style: const TextStyle(
                        //     color: Color(0xFF98A2B3),
                        //     fontSize: 12,
                        //     fontWeight: FontWeight.w500,
                        //   ),
                        // ),
                      ),
                      const SizedBox(width: 12),
                      // User details
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${user.firstName} ${user.lastName}',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF101828),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${user.rollNumber} • ${user.borrowedBooks?.length ?? 0} books',
                              style: const TextStyle(
                                fontSize: 10,
                                color: Color(0xFF667085),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Course badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF2F4F7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          user.degree!.substring(0, 3),
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: Color(0xFF344054),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

// format to time: 11:20 AM
String formatToTime(DateTime dateTime) {
  return '${dateTime.hour}:${dateTime.minute} ${dateTime.hour < 12 ? 'AM' : 'PM'}';
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
    case InhouseUsageStatus.forceEnded:
      return const MapEntry(
        Color(0xFFFEF3F2), // background
        Color(0xFFB42318), // text
      );
  }
}
