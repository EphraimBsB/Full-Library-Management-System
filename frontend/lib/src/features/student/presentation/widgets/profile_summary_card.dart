import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/student/domain/models/profile_summary_model.dart';
import 'package:management_side/src/features/student/presentation/providers/student_profile_providers.dart';

class ProfileSummaryCard extends ConsumerWidget {
  final String userId;

  const ProfileSummaryCard({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileSummaryAsync = ref.watch(profileSummaryProvider(userId));

    return profileSummaryAsync.when(
      data: (profile) => _buildProfileCard(profile, context),
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, stack) =>
          Center(child: Text('Error loading profile: ${error.toString()}')),
    );
  }

  Widget _buildProfileCard(ProfileSummaryModel profile, BuildContext context) {
    return Card(
      color: AppTheme.surfaceColor,
      margin: const EdgeInsets.all(16.0),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          // crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildProfileHeader(profile, context),
            const SizedBox(height: 16),
            _buildStatsSection(profile.stats, context),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(
    ProfileSummaryModel profile,
    BuildContext context,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        CircleAvatar(
          radius: 50,
          backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
          child: CachedNetworkImage(
            imageUrl: profile.avatar!,
            errorWidget: (context, url, error) => Text(
              profile.name[0],
              style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold),
            ),
            placeholder: (context, url) => Text(
              profile.name[0],
              style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(profile.name, style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 4),
        Text(profile.email, style: Theme.of(context).textTheme.bodyMedium),
        if (profile.program != null) ...[
          const SizedBox(height: 4),
          Text(profile.program!, style: Theme.of(context).textTheme.bodyMedium),
        ],
        const SizedBox(height: 8),
        _buildMembershipInfo(profile),
      ],
    );
  }

  Widget _buildMembershipInfo(ProfileSummaryModel profile) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _getMembershipColor(profile.membershipStatus),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        '${profile.membershipType} • ${profile.membershipStatus}',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildStatsSection(Map<String, dynamic> stats, BuildContext context) {
    final borrowStats = stats['borrow'] as Map<String, dynamic>;
    final favoritesCount = stats['favoritesCount'] as int;
    final notesCount = stats['notesCount'] as int;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Text(
        //   'Activity Stats',
        //   style: Theme.of(
        //     context,
        //   ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        // ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildStatItem('Active', borrowStats['active'].toString()),
            _buildStatItem('Overdue', borrowStats['overdue'].toString()),
            _buildStatItem('Returned', borrowStats['returned'].toString()),
            _buildStatItem('Favorites', favoritesCount.toString()),
            _buildStatItem('Notes', notesCount.toString()),
          ],
        ),
      ],
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Color _getMembershipColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return Colors.green;
      case 'expired':
        return Colors.red;
      case 'pending':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }
}
