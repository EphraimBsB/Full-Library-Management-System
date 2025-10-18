// lib/src/features/student/presentation/widgets/notes_list.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';
import 'package:management_side/src/features/student/presentation/providers/student_profile_providers.dart';

class NotesList extends ConsumerWidget {
  final String userId;

  const NotesList({super.key, required this.userId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notesAsync = ref.watch(userNotesProvider(userId));

    return notesAsync.when(
      data: (response) {
        if (response.isEmpty) {
          return const Center(child: Text('No notes found'));
        }

        return GridView.builder(
          padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
          itemCount: response.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 2.3,
          ),
          itemBuilder: (context, index) {
            final note = response[index];
            return _NoteCard(note: note);
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Text(
          'Error loading notes: ${error.toString()}',
          textAlign: TextAlign.center,
        ),
      ),
    );
  }
}

class _NoteCard extends StatelessWidget {
  final BookNote note;

  const _NoteCard({required this.note});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      elevation: 2,
      color: AppTheme.surfaceColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Book info
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Book cover
                Container(
                  width: 60,
                  height: 80,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(4),
                    image: note.book!.coverImageUrl != null
                        ? DecorationImage(
                            image: NetworkImage(note.book!.coverImageUrl!),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: note.book!.coverImageUrl == null
                      ? const Icon(Icons.book, size: 30)
                      : null,
                ),
                const SizedBox(width: 12),

                // Book details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        note.book!.title,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'by ${note.book!.author}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey[600],
                        ),
                      ),
                      if (note.pageNumber != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Page ${note.pageNumber}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: AppTheme.primaryColor,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                // Public/Private indicator
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: note.isPublic! ? Colors.blue[50] : Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        note.isPublic! ? Icons.public : Icons.lock_outline,
                        size: 14,
                        color: note.isPublic!
                            ? Colors.blue[700]
                            : Colors.grey[600],
                      ),
                      const SizedBox(width: 4),
                      Text(
                        note.isPublic! ? 'Public' : 'Private',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: note.isPublic!
                              ? Colors.blue[700]
                              : Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Note content
            Text(note.content, style: theme.textTheme.bodyMedium),

            const SizedBox(height: 12),

            // Date and actions
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _formatDate(note.updatedAt!),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.edit_outlined, size: 20),
                      onPressed: () => _editNote(context, note),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      iconSize: 20,
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.delete_outline, size: 20),
                      onPressed: () => _deleteNote(context, note.id!),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      iconSize: 20,
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        return '${difference.inMinutes} minutes ago';
      }
      return '${difference.inHours} hours ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} days ago';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  void _editNote(BuildContext context, BookNote note) {
    // TODO: Implement edit note
  }

  void _deleteNote(BuildContext context, String noteId) {
    // TODO: Implement delete note
  }
}
