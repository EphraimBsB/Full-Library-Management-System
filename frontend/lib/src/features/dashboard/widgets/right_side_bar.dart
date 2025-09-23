import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/dashboard/models/dashboard_models.dart';

class RightSideBarWidget extends StatelessWidget {
  final List<PendingLoan> pendingLoans;
  final List<ActiveUser> activeUsers;

  RightSideBarWidget({
    super.key,
    List<PendingLoan>? pendingLoans,
    List<ActiveUser>? activeUsers,
  }) : pendingLoans = pendingLoans ?? samplePendingLoans,
       activeUsers = activeUsers ?? sampleActiveUsers;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 392,
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
              'Pending Loans Requests',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF101828),
              ),
            ),
            Divider(color: AppTheme.textSecondaryColor, thickness: 0.5),
            const SizedBox(height: 16),

            // Pending Loans List
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: pendingLoans.length,
              separatorBuilder: (context, index) => const SizedBox(height: 20),
              itemBuilder: (context, index) {
                final loan = pendingLoans[index];
                final isOverdue = loan.status == 'Overdue';

                return Column(
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
                            child: Image.network(
                              loan.coverImage,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  const SizedBox.shrink(),
                              loadingBuilder:
                                  (context, child, loadingProgress) {
                                    if (loadingProgress == null) return child;
                                    return const Center(
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
                                    );
                                  },
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
                                loan.bookTitle,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF101828),
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'DDC: ${loan.ddcNumber} | ACC: ${loan.accessNumber}',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: Color(0xFF667085),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${loan.borrowerName} (${loan.rollNumber})',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: Color(0xFF667085),
                                ),
                              ),
                              const SizedBox(height: 2),
                              // Due date
                              Text(
                                'Due: ${DateFormat('MMM d, yyyy').format(loan.dueDate)}',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: Color(0xFF667085),
                                ),
                              ),
                              const SizedBox(height: 2),
                              // Status badge
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: isOverdue
                                      ? const Color(0xFFFEF3F2)
                                      : const Color(0xFFECFDF3),
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Text(
                                  loan.status,
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w500,
                                    color: isOverdue
                                        ? const Color(0xFFB42318)
                                        : const Color(0xFF027A48),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
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
                        child: user.profileImage.isNotEmpty
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(20),
                                child: Image.network(
                                  user.profileImage,
                                  width: 40,
                                  height: 40,
                                  fit: BoxFit.cover,
                                ),
                              )
                            : Text(
                                user.name[0],
                                style: const TextStyle(
                                  color: Color(0xFF98A2B3),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                      ),
                      const SizedBox(width: 12),
                      // User details
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.name,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF101828),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${user.rollNumber} • ${user.booksBorrowed} books',
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
                          user.course,
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
