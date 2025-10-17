// ignore_for_file: unused_result

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/dashboard/presentation/widgets/topbar.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/loans/presentation/providers/loan_provider.dart';
import 'package:management_side/src/features/loans/presentation/widgets/build_loan_card.dart';
import 'package:management_side/src/features/requests/presentation/providers/pending_requests_provider.dart';
import 'package:management_side/src/features/loans/presentation/widgets/request_card.dart';

enum LoanSortOption {
  newestFirst,
  oldestFirst,
  dueDateAscending,
  dueDateDescending,
  borrowerName,
  bookTitle,
  status,
}

class LoanListScreen extends ConsumerStatefulWidget {
  const LoanListScreen({super.key});

  @override
  ConsumerState<LoanListScreen> createState() => _LoanListScreenState();
}

class _LoanListScreenState extends ConsumerState<LoanListScreen> {
  final TextEditingController _searchController = TextEditingController();
  LoanStatus? _selectedStatus;
  bool _isLoading = false;
  LoanSortOption _currentSortOption = LoanSortOption.newestFirst;

  Future<void> _loadLoans() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      // Trigger a refresh of the data
      await ref.refresh(allLoansProvider.future);
    } catch (e) {
      if (mounted) {
        // Handle error if needed
        debugPrint('Error loading loans: $e');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _loadLoans();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Color _getStatusColor(LoanStatus status) {
    switch (status) {
      case LoanStatus.borrowed:
        return Colors.blue;
      case LoanStatus.returned:
        return Colors.yellow;
      case LoanStatus.overdue:
        return Colors.red;
      case LoanStatus.active:
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  // Get sort option display names
  String getSortOptionName(LoanSortOption option) {
    switch (option) {
      case LoanSortOption.newestFirst:
        return 'Newest First';
      case LoanSortOption.oldestFirst:
        return 'Oldest First';
      case LoanSortOption.dueDateAscending:
        return 'Due Date (Ascending)';
      case LoanSortOption.dueDateDescending:
        return 'Due Date (Descending)';
      case LoanSortOption.borrowerName:
        return 'Borrower Name';
      case LoanSortOption.bookTitle:
        return 'Book Title';
      case LoanSortOption.status:
        return 'Status';
    }
  }

  @override
  Widget build(BuildContext context) {
    final loanState = ref.watch(allLoansProvider);
    final pendingRequestsAsync = ref.watch(pendingBookRequestsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: CustomScrollView(
        slivers: [
          // Fixed app bar with title
          const SliverAppBar(
            pinned: true,
            floating: false,
            automaticallyImplyLeading: false,
            toolbarHeight: 100,
            backgroundColor: const Color(0xFFF5F7FA),
            flexibleSpace: TopbarWidget(),
          ),
          SliverToBoxAdapter(
            child: Column(
              children: [
                // Search and filter bar
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    children: [
                      // Search field
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          style: const TextStyle(fontSize: 12),
                          decoration: InputDecoration(
                            hintText: 'Search transactions...',
                            hintStyle: const TextStyle(fontSize: 12),
                            prefixIcon: const Icon(Icons.search),
                            suffixIcon: IconButton(
                              icon: const Icon(Icons.clear),
                              onPressed: () {
                                _searchController.clear();
                                _loadLoans();
                              },
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8.0),
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              vertical: 8.0,
                            ),
                            isDense: true,
                          ),
                          onSubmitted: (_) => _loadLoans(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Status dropdown
                      Expanded(
                        child: SizedBox(
                          height: 40,
                          child: DropdownButtonFormField<LoanStatus?>(
                            initialValue: _selectedStatus,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.black,
                              fontWeight: FontWeight.w500,
                            ),
                            decoration: InputDecoration(
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 0,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            hint: const Text('Filter by Status'),
                            items: [
                              const DropdownMenuItem(
                                value: null,
                                child: Text('All Statuses'),
                              ),
                              ...LoanStatus.values.map(
                                (status) => DropdownMenuItem(
                                  value: status,
                                  child: Text(
                                    status.toString().split('.').last,
                                    style: TextStyle(
                                      color: _getStatusColor(status),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                            onChanged: (value) {
                              setState(() {
                                _selectedStatus = value;
                              });
                              _loadLoans();
                            },
                            isExpanded: true,
                            borderRadius: BorderRadius.circular(8),
                            icon: const Icon(Icons.arrow_drop_down),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Sort dropdown
                      Expanded(
                        child: SizedBox(
                          height: 40,
                          child: DropdownButtonFormField<LoanSortOption>(
                            initialValue: _currentSortOption,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Colors.black,
                              fontWeight: FontWeight.w500,
                            ),
                            decoration: InputDecoration(
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 0,
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            hint: const Text('Sort By'),
                            items: LoanSortOption.values
                                .map(
                                  (option) => DropdownMenuItem(
                                    value: option,
                                    child: Text(getSortOptionName(option)),
                                  ),
                                )
                                .toList(),
                            onChanged: (value) {
                              if (value != null) {
                                setState(() {
                                  _currentSortOption = value;
                                });
                              }
                            },
                            isExpanded: true,
                            borderRadius: BorderRadius.circular(8),
                            icon: const Icon(Icons.sort),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Combined view of Pending Requests and All Loans
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Pending Requests Section
                pendingRequestsAsync.when(
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24.0),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (error, stack) => Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      'Error loading pending requests: $error',
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                  data: (pendingRequests) {
                    if (pendingRequests.isEmpty) {
                      return const SizedBox.shrink();
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Padding(
                          padding: EdgeInsets.symmetric(
                            horizontal: 16.0,
                            vertical: 8.0,
                          ),
                          child: Text(
                            'Pending Requests',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.black87,
                            ),
                          ),
                        ),
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16.0,
                            vertical: 8.0,
                          ),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 4,
                                childAspectRatio: 1.7,
                                crossAxisSpacing: 16,
                                mainAxisSpacing: 16,
                                // mainAxisExtent: 200,
                              ),
                          itemCount: pendingRequests.length,
                          itemBuilder: (context, index) {
                            return RequestCard(request: pendingRequests[index]);
                          },
                        ),
                        const SizedBox(height: 24.0),
                      ],
                    );
                  },
                ),

                // All Loans Section
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24.0,
                    vertical: 8.0,
                  ),
                  child: Text(
                    'All Loans',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                    ),
                  ),
                ),

                // Loans Grid
                loanState.when(
                  loading: () => const Padding(
                    padding: EdgeInsets.symmetric(vertical: 24.0),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (error, stack) => Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Text(
                      'Error loading loans: $error',
                      style: const TextStyle(color: Colors.red),
                    ),
                  ),
                  data: (loans) {
                    if (loans.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.all(24.0),
                        child: Center(child: Text('No loans found')),
                      );
                    }
                    return GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16.0,
                        vertical: 8.0,
                      ),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 4,
                            childAspectRatio: 1.2,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                            // mainAxisExtent: 200,
                          ),
                      itemCount: loans.length,
                      itemBuilder: (context, index) {
                        return buildLoanCard(context, loans[index]);
                      },
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
