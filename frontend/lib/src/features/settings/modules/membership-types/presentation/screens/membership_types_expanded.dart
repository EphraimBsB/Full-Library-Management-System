import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/membership-types/domain/models/membership_type_model.dart';
import 'package:management_side/src/features/settings/modules/membership-types/presentation/providers/membership_types_providers.dart';
import 'package:management_side/src/features/settings/modules/membership-types/presentation/screens/membership_types_dialog.dart';
import 'package:management_side/src/features/settings/presentation/widgets/build_expandable_items.dart';

class MembershipTypesExpanded extends ConsumerWidget {
  const MembershipTypesExpanded({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membershipTypesAsync = ref.watch(membershipTypesNotifierProvider);

    return buildExpandableSettingItem(
      icon: Icons.card_membership,
      title: 'Membership Types',
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add Membership Type'),
              onPressed: () => _showMembershipTypeDialog(context, ref, null),
            ),
          ),
          const SizedBox(height: 8),
          membershipTypesAsync.when(
            data: (types) => types.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No membership types found'),
                  )
                : Column(
                    children: types
                        .map(
                          (type) =>
                              _buildMembershipTypeItem(context, ref, type),
                        )
                        .toList(),
                  ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text('Error loading membership types: $error'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMembershipTypeItem(
    BuildContext context,
    WidgetRef ref,
    MembershipType membershipType,
  ) {
    return ListTile(
      title: Text(
        membershipType.name,
        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
      ),
      subtitle: Text(
        'Max Books: ${membershipType.maxBooks} • '
        'Max Days: ${membershipType.maxDurationDays} • '
        'Fine: ${membershipType.fineRate}',
        style: const TextStyle(fontSize: 12),
      ),
      trailing: IconButton(
        icon: const Icon(
          Icons.remove_red_eye_outlined,
          size: 20,
          color: Colors.grey,
        ),
        onPressed: () =>
            _showMembershipTypeDialog(context, ref, membershipType),
        padding: EdgeInsets.zero,
        constraints: const BoxConstraints(),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }

  Future<void> _showMembershipTypeDialog(
    BuildContext context,
    WidgetRef ref,
    MembershipType? membershipType,
  ) async {
    await showDialog(
      context: context,
      builder: (context) =>
          MembershipTypeDialog(membershipType: membershipType),
    );

    if (context.mounted) {
      ref.invalidate(membershipTypesNotifierProvider);
    }
  }
}
