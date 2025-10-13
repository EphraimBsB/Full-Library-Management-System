import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/settings/modules/user-roles/domain/models/user_role_model.dart';
import 'package:management_side/src/features/settings/modules/user-roles/presentation/providers/user_roles_providers.dart';
import 'package:management_side/src/features/settings/modules/user-roles/presentation/screens/user_roles_dialog.dart';
import 'package:management_side/src/features/settings/presentation/widgets/build_expandable_items.dart';

Future<void> _showRoleDialog(BuildContext context, {String? roleId}) async {
  final result = await showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) => Dialog(
      insetPadding: const EdgeInsets.all(16),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 500),
        child: UserRolesScreen(roleId: roleId),
      ),
    ),
  );

  if (result == true && context.mounted) {
    // Refresh roles
    final container = ProviderScope.containerOf(context);
    await container.read(userRolesProvider.notifier).loadRoles();
  }
}

class UserRolesExpanded extends ConsumerWidget {
  const UserRolesExpanded({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rolesAsync = ref.watch(userRolesProvider);

    return buildExpandableSettingItem(
      icon: Icons.manage_accounts,
      title: 'User Roles Management',
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              icon: const Icon(Icons.add, size: 20),
              label: const Text('Add Role'),
              onPressed: () => _showRoleDialog(context),
            ),
          ),
          const SizedBox(height: 8),
          rolesAsync.when(
            data: (roles) => roles.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No roles found'),
                  )
                : Column(
                    children: roles
                        .map((role) => _buildRoleItem(role, context, ref))
                        .toList(),
                  ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Padding(
              padding: const EdgeInsets.all(16.0),
              child: Text('Error loading roles: $error'),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _buildRoleItem(UserRole role, BuildContext context, WidgetRef ref) {
  return Card(
    margin: const EdgeInsets.symmetric(vertical: 4),
    elevation: 0,
    color: Colors.grey.shade50,
    child: ListTile(
      title: Text(
        role.name,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
      ),
      subtitle: Text(
        role.description ?? '',
        style: const TextStyle(fontSize: 12),
      ),
      trailing: IconButton(
        icon: const Icon(
          Icons.remove_red_eye_outlined,
          size: 20,
          color: Colors.grey,
        ),
        onPressed: () => _showRoleDialog(context, roleId: role.id.toString()),
        padding: const EdgeInsets.only(left: 16),
        constraints: const BoxConstraints(),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    ),
  );
}
