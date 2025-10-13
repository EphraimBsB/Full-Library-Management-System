import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/membership/presentation/screens/membership_request_detail_screen.dart';
import 'package:management_side/src/features/membership/presentation/screens/membership_request_form_screen.dart';
import 'package:management_side/src/features/membership/presentation/widgets/membership_request_card.dart';
import 'package:management_side/src/features/membership/presentation/providers/membership_request_provider.dart';

class MembershipRequestsScreen extends ConsumerWidget {
  const MembershipRequestsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final membershipRequestsAsync = ref.watch(
      membershipRequestNotifierProvider,
    );
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Membership Requests'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => showMembershipRequestFormDialog(context),
          ),
        ],
      ),
      body: membershipRequestsAsync.when(
        data: (requests) => requests.isEmpty
            ? Center(
                child: Text(
                  'No membership requests found',
                  style: theme.textTheme.titleMedium,
                ),
              )
            : RefreshIndicator(
                onRefresh: () => ref
                    .refresh(membershipRequestNotifierProvider.notifier)
                    .refresh(),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: requests.length,
                  itemBuilder: (context, index) {
                    final request = requests[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: MembershipRequestCard(
                        request: request,
                        onTap: () => showMembershipRequestDialog(
                          context,
                          requestId: request.id,
                        ),
                      ),
                    );
                  },
                ),
              ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text('Error loading requests: $error'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref
                    .refresh(membershipRequestNotifierProvider.notifier)
                    .refresh(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
