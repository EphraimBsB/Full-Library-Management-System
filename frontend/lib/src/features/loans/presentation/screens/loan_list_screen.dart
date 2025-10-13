// ignore_for_file: unused_result

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/dashboard/presentation/widgets/topbar.dart';
import 'package:management_side/src/features/loans/domain/models/loan_model.dart';
import 'package:management_side/src/features/loans/presentation/providers/loan_provider.dart';
import 'package:management_side/src/features/loans/presentation/widgets/build_loan_card.dart';

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
    final loanState = ref.watch(allLoansProvider);
    final loans = loanState.value ?? [];
    final error = loanState.error;
    final isLoading = _isLoading || loanState.isLoading;

    // Apply filters and search
    final filteredLoans = loans.where((loan) {
      final matchesSearch =
          _searchController.text.isEmpty ||
          loan.bookData!['title'].toLowerCase().contains(
            _searchController.text.toLowerCase(),
          ) ||
          '${loan.user!['firstName']} ${loan.user!['lastName']}'
              .toLowerCase()
              .contains(_searchController.text.toLowerCase());

      final matchesStatus =
          _selectedStatus == null || loan.status == _selectedStatus;

      return matchesSearch && matchesStatus;
    }).toList();

    // Apply sorting
    List<Loan> sortedLoans = List.from(filteredLoans);
    switch (_currentSortOption) {
      case LoanSortOption.newestFirst:
        sortedLoans.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        break;
      case LoanSortOption.oldestFirst:
        sortedLoans.sort((a, b) => a.createdAt.compareTo(b.createdAt));
        break;
      case LoanSortOption.dueDateAscending:
        sortedLoans.sort((a, b) => a.dueDate.compareTo(b.dueDate));
        break;
      case LoanSortOption.dueDateDescending:
        sortedLoans.sort((a, b) => b.dueDate.compareTo(a.dueDate));
        break;
      case LoanSortOption.borrowerName:
        sortedLoans.sort(
          (a, b) => '${a.user!['firstName']} ${a.user!['lastName']}'.compareTo(
            '${b.user!['firstName']} ${b.user!['lastName']}',
          ),
        );
        break;
      case LoanSortOption.bookTitle:
        sortedLoans.sort(
          (a, b) => a.bookData!['title'].compareTo(b.bookData!['title']),
        );
        break;
      case LoanSortOption.status:
        sortedLoans.sort(
          (a, b) => a.status.toString().compareTo(b.status.toString()),
        );
        break;
    }

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
                          value: _currentSortOption,
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
                          childAspectRatio: 0.9,
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
