import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/dashboard/presentation/providers/dashboard_summary_provider.dart';
import 'package:management_side/src/features/loans/presentation/screens/loan_details_dialog.dart';
import 'package:management_side/src/features/requests/presentation/screens/request_details_dialog.dart';

class RightSideBarWidget extends ConsumerWidget {
  const RightSideBarWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingRequests = ref.watch(pendingRequestsProvider);
    final recentOverdues = ref.watch(recentOverduesProvider);
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
              'Books Loans',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF101828),
              ),
            ),
            Divider(color: AppTheme.textSecondaryColor, thickness: 0.5),
            const SizedBox(height: 16),

            if (pendingRequests.isEmpty && recentOverdues.isEmpty)
              const Center(
                child: Text(
                  'No data available',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textSecondaryColor,
                  ),
                ),
              ),

            // Pending Loans List
            if (pendingRequests.isEmpty && recentOverdues.isNotEmpty)
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: recentOverdues.length,
                separatorBuilder: (context, index) =>
                    const SizedBox(height: 20),
                itemBuilder: (context, index) {
                  final loan = recentOverdues[index];
                  final daysDifference = loan.dueDate
                      .difference(DateTime.now())
                      .inDays
                      .abs();

                  return GestureDetector(
                    onTap: () async {
                      final result = await LoanDetailsDialog.show(
                        context,
                        loan: loan,
                        isAdmin: true, // or false for regular users
                      );

                      // Handle the result if needed
                      if (result == 'APPROVED') {
                        // Refresh the pending requests list
                        ref.invalidate(pendingRequestsProvider);
                      }
                    },
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
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
                                  image: AssetImage('assets/default_book.jpg'),
                                  fit: BoxFit.cover,
                                ),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(2),
                                child: CachedNetworkImage(
                                  imageUrl:
                                      loan.bookCopy!['book']['coverImageUrl'] ??
                                      'assets/default_book.jpg',
                                  fit: BoxFit.cover,
                                  errorWidget: (context, error, stackTrace) =>
                                      const SizedBox.shrink(),
                                  placeholder: (context, url) => const Center(
                                    child: SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                              Color(0xFF7F56D9),
                                            ),
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
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    loan.bookCopy!['book']['title'] ??
                                        'Unknown Title',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    loan.bookCopy!['accessNumber'] ?? 'N/A',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w500,
                                      color: AppTheme.textSecondaryColor,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    'Borrowed By: ${loan.user!['firstName']} ${loan.user!['lastName']}',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.textSecondaryColor,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  // Due date
                                  Text(
                                    'Due In: $daysDifference days',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.secondaryColor,
                                    ),
                                  ),
                                  // const SizedBox(height: 2),
                                  // // Status badge
                                  // Container(
                                  //   padding: const EdgeInsets.symmetric(
                                  //     horizontal: 8,
                                  //     vertical: 2,
                                  //   ),
                                  //   decoration: BoxDecoration(
                                  //     color: const Color(0xFFECFDF3),
                                  //     borderRadius: BorderRadius.circular(16),
                                  //   ),
                                  //   child: Text(
                                  //     request.status!,
                                  //     style: TextStyle(
                                  //       fontSize: 10,
                                  //       fontWeight: FontWeight.w500,
                                  //       color: const Color(0xFF027A48),
                                  //     ),
                                  //   ),
                                  // ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),

            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: pendingRequests.length,
              separatorBuilder: (context, index) => const SizedBox(height: 20),
              itemBuilder: (context, index) {
                final request = pendingRequests[index];

                return GestureDetector(
                  onTap: () async {
                    final result = await RequestDetailsDialog.show(
                      context,
                      request: request,
                      isAdmin: true, // or false for regular users
                    );

                    // Handle the result if needed
                    if (result == 'APPROVED') {
                      // Refresh the pending requests list
                      ref.invalidate(pendingRequestsProvider);
                    }
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
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
                                image: AssetImage('assets/default_book.jpg'),
                                fit: BoxFit.cover,
                              ),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(2),
                              child: CachedNetworkImage(
                                imageUrl:
                                    request.book!['coverImageUrl'] ??
                                    'assets/default_book.jpg',
                                fit: BoxFit.cover,
                                errorWidget: (context, error, stackTrace) =>
                                    const SizedBox.shrink(),
                                placeholder: (context, url) => const Center(
                                  child: SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Color(0xFF7F56D9),
                                      ),
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
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  request.book!['title'] ?? 'Unknown Title',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Available Copies: ${request.book!['availableCopies']}',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.green,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Requested By: ${request.user!['firstName']} ${request.user!['lastName']}',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w500,
                                    color: AppTheme.textSecondaryColor,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                // Due date
                                Text(
                                  'Request Date: ${DateFormat('MMM d, yyyy').format(request.createdAt!)}',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w500,
                                    color: AppTheme.textSecondaryColor,
                                  ),
                                ),
                                // const SizedBox(height: 2),
                                // // Status badge
                                // Container(
                                //   padding: const EdgeInsets.symmetric(
                                //     horizontal: 8,
                                //     vertical: 2,
                                //   ),
                                //   decoration: BoxDecoration(
                                //     color: const Color(0xFFECFDF3),
                                //     borderRadius: BorderRadius.circular(16),
                                //   ),
                                //   child: Text(
                                //     request.status!,
                                //     style: TextStyle(
                                //       fontSize: 10,
                                //       fontWeight: FontWeight.w500,
                                //       color: const Color(0xFF027A48),
                                //     ),
                                //   ),
                                // ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
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
