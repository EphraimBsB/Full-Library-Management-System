import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/requests/presentation/providers/pending_requests_provider.dart';
import 'package:management_side/src/features/requests/presentation/screens/request_details_dialog.dart';

class RequestsListScreen extends ConsumerWidget {
  const RequestsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pendingRequests = ref.watch(pendingBookRequestsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Book Requests'), centerTitle: true),
      body: pendingRequests.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('Error: $error')),
        data: (requests) {
          if (requests.isEmpty) {
            return const Center(child: Text('No pending requests'));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: requests.length,
            itemBuilder: (context, index) {
              final request = requests[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                child: ListTile(
                  contentPadding: const EdgeInsets.all(16),
                  leading: Container(
                    width: 50,
                    height: 70,
                    decoration: BoxDecoration(
                      color: Colors.grey[200],
                      borderRadius: BorderRadius.circular(4),
                      image: request.book?['coverImageUrl'] != null
                          ? DecorationImage(
                              image: NetworkImage(
                                request.book!['coverImageUrl'],
                              ),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: request.book?['coverImageUrl'] == null
                        ? const Icon(Icons.book, color: Colors.grey)
                        : null,
                  ),
                  title: Text(
                    request.book?['title'] ?? 'Unknown Title',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(
                        'Requested by: ${request.user?['firstName'] ?? ''} ${request.user?['lastName'] ?? ''}',
                      ),
                      Text(
                        'Status: ${request.status?.toUpperCase() ?? 'PENDING'}',
                        style: TextStyle(
                          color: _getStatusColor(request.status),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  onTap: () async {
                    final result = await RequestDetailsDialog.show(
                      context,
                      request: request,
                      isAdmin: true,
                    );

                    if (result != null) {
                      ref.invalidate(pendingBookRequestsProvider);
                    }
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  Color _getStatusColor(String? status) {
    switch (status?.toLowerCase()) {
      case 'approved':
        return AppTheme.successColor;
      case 'rejected':
        return AppTheme.errorColor;
      case 'cancelled':
        return Colors.orange;
      case 'pending':
      default:
        return Colors.blue;
    }
  }
}
