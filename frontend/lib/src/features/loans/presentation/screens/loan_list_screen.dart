import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/dashboard/widgets/topbar.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/loans/presentation/providers/loan_provider.dart';
import 'package:management_side/src/features/loans/presentation/widgets/build_loan_card.dart';

class LoanListScreen extends ConsumerStatefulWidget {
  const LoanListScreen({super.key});

  @override
  ConsumerState<LoanListScreen> createState() => _LoanListScreenState();
}

class _LoanListScreenState extends ConsumerState<LoanListScreen> {
  final TextEditingController _searchController = TextEditingController();
  LoanStatus? _selectedStatus;
  bool _isLoading = false;

  Future<void> _loadLoans() async {
    setState(() => _isLoading = true);
    try {
      await ref
          .read(loanProvider.notifier)
          .loadLoans(
            searchQuery: _searchController.text.isEmpty
                ? null
                : _searchController.text,
            status: _selectedStatus,
          );
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
        return Colors.green;
      case LoanStatus.overdue:
        return Colors.red;
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
    final loanState = ref.watch(loanProvider);
    final loans = loanState.loans;
    final error = loanState.error;
    final isLoading = _isLoading || loanState.isLoading;
    final currentSortOption = loanState.currentSortOption;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: Column(
        children: [
          const TopbarWidget(),
          const SizedBox(height: 16),
          // Search and filter bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                Row(
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
                          value: _selectedStatus,
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
                          value: currentSortOption,
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
                              ref.read(loanProvider).sortLoans(value);
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
              ],
            ),
          ),
          // Loan list view
          Expanded(
            child: Builder(
              builder: (context) {
                if (isLoading && loans.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (error != null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.error_outline,
                          color: Colors.red,
                          size: 48,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Failed to load loans: $error',
                          style: const TextStyle(color: Colors.red),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadLoans,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  );
                }

                if (loans.isEmpty) {
                  return const Center(child: Text('No loans found'));
                }

                return RefreshIndicator(
                  onRefresh: _loadLoans,
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          childAspectRatio: 1.02,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                        ),
                    itemCount: loans.length,
                    itemBuilder: (context, index) {
                      return buildLoanCard(context, loans[index]);
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
