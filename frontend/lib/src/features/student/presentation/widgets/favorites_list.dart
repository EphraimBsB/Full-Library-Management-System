// lib/src/features/student/presentation/widgets/favorites_list.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/student/presentation/providers/student_profile_providers.dart';
import 'package:management_side/src/features/student/presentation/widgets/build_book_card_web.dart';

class FavoritesList extends ConsumerWidget {
  final String userId;

  const FavoritesList({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final favoritesAsync = ref.watch(favoritesProvider(userId));

    return favoritesAsync.when(
      data: (response) {
        if (response.isEmpty) {
          return const Center(child: Text('No favorites found'));
        }

        return GridView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.7,
          ),
          itemCount: response.length,
          itemBuilder: (context, index) {
            final book = response[index];
            return buildBookCardWeb(book, context, ref);
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Text(
          'Error loading favorites: ${error.toString()}',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}
