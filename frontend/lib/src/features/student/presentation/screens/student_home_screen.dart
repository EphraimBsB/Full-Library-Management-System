import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/auth/presentation/providers/auth_state_provider.dart';
import 'package:management_side/src/features/auth/presentation/widgets/login_dialog.dart';
import 'package:management_side/src/features/auth/utils/token_storage.dart';
import 'package:management_side/src/features/books/domain/models/book_model_new.dart';
import 'package:management_side/src/features/books/presentation/providers/paginated_books_provider.dart';
import 'package:management_side/src/core/utils/responsive_utils.dart';
import 'package:management_side/src/core/widgets/numbered_pagination_widget.dart';
import 'package:management_side/src/features/student/presentation/widgets/build_book_card_web.dart';
import 'package:management_side/src/features/student/presentation/widgets/membership_request_dialog.dart';

class StudentHomeScreen extends ConsumerStatefulWidget {
  const StudentHomeScreen({super.key});

  @override
  ConsumerState<StudentHomeScreen> createState() => _StudentHomeScreenState();
}

class _StudentHomeScreenState extends ConsumerState<StudentHomeScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();

    // Load initial data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final notifier = ref.read(paginatedBooksProvider.notifier);
      notifier.loadPage(page: 1, limit: 10);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final paginatedState = ref.watch(paginatedBooksProvider);
    final paginatedData = ref.watch(currentPaginatedBooksProvider);
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            InkWell(
              onTap: () => context.go('/'),
              child: Image.asset(
                'assets/logo.png',
                height: ResponsiveUtils.isMobile(context)
                    ? 48
                    : 64, // Smaller on mobile
              ),
            ),
          ],
        ),
        actions: [
          if (user != null) ...[
            if (!ResponsiveUtils.isMobile(context)) ...[
              // Show full profile on non-mobile
              _buildUserProfile(context, ref, user),
            ] else ...[
              // Show only avatar on mobile
              IconButton(
                icon: CircleAvatar(
                  radius: 16,
                  backgroundColor: Theme.of(context).primaryColor,
                  child: user['avatarUrl'] != null
                      ? Image.network(
                          user['avatarUrl']!,
                          headers: const {'Accept': 'image/webp,image/*'},
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return const CircularProgressIndicator();
                          },
                          errorBuilder: (context, error, stackTrace) => Text(
                            '${user['firstName'][0]}${user['lastName']?.isNotEmpty == true ? user['lastName'][0] : ''}',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          fit: BoxFit.cover,
                        )
                      : Text(
                          '${user['firstName'][0]}${user['lastName']?.isNotEmpty == true ? user['lastName'][0] : ''}',
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                ),
                onPressed: () => _showProfileMenu(context, ref),
              ),
            ],
          ] else ...[
            // For non-logged in users
            if (!ResponsiveUtils.isMobile(context)) ...[
              // Full buttons on desktop/tablet
              TextButton(
                onPressed: () {},
                child: const Text(
                  'Home',
                  style: TextStyle(
                    color: AppTheme.primaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              TextButton(
                onPressed: () => showLoginDialog(
                  context,
                  message: 'Please sign in to continue',
                ),
                child: const Text(
                  'Sign In',
                  style: TextStyle(
                    color: AppTheme.textPrimaryColor,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () async {
                  final result = await showDialog<bool>(
                    context: context,
                    builder: (context) => const MembershipRequestDialog(),
                  );
                  if (result == true && context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Membership request submitted successfully!',
                        ),
                        backgroundColor: Colors.green,
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 8,
                  ),
                ),
                child: const Text('Sign Up'),
              ),
            ] else ...[
              // Mobile view for non-logged in users
              IconButton(
                icon: const Icon(Icons.login, color: AppTheme.primaryColor),
                onPressed: () => showLoginDialog(
                  context,
                  message: 'Please sign in to continue',
                ),
              ),
            ],
          ],
          const SizedBox(width: 8),
        ],
      ),
      body: paginatedState.isLoading
          ? const Center(child: CircularProgressIndicator())
          : paginatedState.error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Error loading books. Please try again.\n${paginatedState.error}',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.red),
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        ref.read(paginatedBooksProvider.notifier).refresh();
                      },
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          : paginatedState.books.isEmpty
          ? const Center(child: Text('No books found matching your criteria.'))
          : _buildPaginatedContent(context, ref, paginatedState, paginatedData),
    );
  }

  Widget _buildPaginatedContent(
    BuildContext context,
    WidgetRef ref,
    dynamic paginatedState,
    dynamic paginatedData,
  ) {
    return SingleChildScrollView(
      // padding: ResponsiveUtils.getOuterPagePadding(context),
      child: Padding(
        padding: ResponsiveUtils.getPagePadding(context),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),
            Center(
              child: const Text(
                'Find a book',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ),
            const SizedBox(height: 30),
            Center(
              child: const Text(
                "Today a reader, Tomorrow a leader\nfind a book by title or by author, borrow a book, find book location in the library. Everything you need for better future and success has already been writen.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w400,
                  color: AppTheme.textSecondaryColor,
                ),
              ),
            ),
            const SizedBox(height: 15),
            _buildSearchBar(ref),
            const SizedBox(height: 32),
            // All Books Section
            const Text(
              'All Books',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 16),
            // Responsive grid of all books
            LayoutBuilder(
              builder: (context, _) {
                final gridSettings = ResponsiveUtils.getGridSettings(context);

                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: gridSettings.crossAxisCount,
                    childAspectRatio: gridSettings.childAspectRatio,
                    crossAxisSpacing: gridSettings.spacing,
                    mainAxisSpacing: gridSettings.spacing,
                    mainAxisExtent: gridSettings.mainAxisExtent,
                  ),
                  itemCount: paginatedState.books.length,
                  itemBuilder: (context, index) {
                    return buildBookCardWeb(
                      paginatedState.books[index],
                      context,
                      ref,
                    );
                  },
                );
              },
            ),
            const SizedBox(height: 40),

            // Pagination controls
            NumberedPaginationWidget<BookModel>(
              data: paginatedData,
              onPageChanged: (page) {
                ref.read(paginatedBooksProvider.notifier).goToPage(page);
              },
              maxVisiblePages: 7,
              inactiveColor: AppTheme.textSecondaryColor,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar(WidgetRef ref) {
    final notifier = ref.read(paginatedBooksProvider.notifier);

    return TextField(
      style: const TextStyle(fontSize: 13),
      decoration: InputDecoration(
        hintText: 'Search by title, author, or ISBN',
        prefixIcon: const Icon(Icons.search),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none,
        ),
        filled: true,
        fillColor: Colors.grey[100],
        contentPadding: const EdgeInsets.symmetric(horizontal: 16),
      ),
      onSubmitted: (value) {
        notifier.applyFilters(search: value.isEmpty ? null : value);
      },
    );
  }

  Widget _buildUserProfile(
    BuildContext context,
    WidgetRef ref,
    Map<String, dynamic> user,
  ) {
    return PopupMenuButton<String>(
      offset: const Offset(0, 50),
      color: AppTheme.backgroundColor,
      itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
        const PopupMenuItem<String>(
          value: 'profile',
          child: Row(
            children: [
              Icon(
                Icons.person_outline,
                size: 20,
                color: AppTheme.textPrimaryColor,
              ),
              SizedBox(width: 8),
              Text(
                'My Profile',
                style: TextStyle(
                  color: AppTheme.textPrimaryColor,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
        const PopupMenuDivider(),
        PopupMenuItem<String>(
          value: 'logout',
          child: Row(
            children: [
              const Icon(Icons.logout, size: 20, color: Colors.red),
              const SizedBox(width: 8),
              Text('Logout', style: TextStyle(color: Colors.red, fontSize: 12)),
            ],
          ),
        ),
      ],
      onSelected: (String value) async {
        if (value == 'profile') {
          if (context.mounted) {
            context.go('/profile');
          }
        } else if (value == 'logout') {
          await tokenStorage.clearAll();
          if (context.mounted) {
            ref.invalidate(paginatedBooksProvider);
            ref.invalidate(currentUserProvider);
            context.go('/');
          }
        }
      },
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: Theme.of(context).primaryColor,
            child: Image.network(
              user['avatarUrl'] ?? '',
              headers: const {'Accept': 'image/webp,image/*'},
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return const Center(child: CircularProgressIndicator());
              },
              errorBuilder: (context, error, stackTrace) => Text(
                '${user['firstName'][0]}${user['lastName']?.isNotEmpty == true ? user['lastName'][0] : ''}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          if (!ResponsiveUtils.isMobile(context)) ...[
            const SizedBox(width: 8),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${user['firstName']} ${user['lastName'] ?? ''}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppTheme.textPrimaryColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                if (user['degree'] != null || user['role'] != null)
                  Row(
                    children: [
                      if (user['degree'] != null)
                        Text(
                          '${user['degree']}',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppTheme.textSecondaryColor,
                                fontSize: 12,
                              ),
                        ),
                      if (user['degree'] != null && user['role'] != null)
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 4.0),
                          child: Text(
                            '•',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textSecondaryColor,
                            ),
                          ),
                        ),
                      if (user['role'] != null)
                        Text(
                          '${user['role']['name']}',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppTheme.textSecondaryColor,
                                fontSize: 12,
                              ),
                        ),
                    ],
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  void _showProfileMenu(BuildContext context, WidgetRef ref) {
    showMenu<String>(
      context: context,
      position: const RelativeRect.fromLTRB(0, 60, 0, 0),
      items: [
        PopupMenuItem<String>(
          value: 'profile',
          child: Row(
            children: const [
              Icon(
                Icons.person_outline,
                size: 20,
                color: AppTheme.textPrimaryColor,
              ),
              SizedBox(width: 8),
              Text('My Profile'),
            ],
          ),
        ),
        const PopupMenuDivider(),
        PopupMenuItem<String>(
          value: 'logout',
          child: Row(
            children: const [
              Icon(Icons.logout, size: 20, color: Colors.red),
              SizedBox(width: 8),
              Text('Logout', style: TextStyle(color: Colors.red)),
            ],
          ),
        ),
      ],
    ).then((value) {
      if (value == 'profile') {
        if (context.mounted) {
          context.go('/profile');
        }
      } else if (value == 'logout') {
        tokenStorage.clearAll();
        if (context.mounted) {
          ref.invalidate(paginatedBooksProvider);
          ref.invalidate(currentUserProvider);
          context.go('/');
        }
      }
    });
  }
}
