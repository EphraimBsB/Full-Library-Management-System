import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show DateFormat;
import 'package:management_side/src/core/theme/app_theme.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';

class NoteItem extends StatefulWidget {
  final BookNote note;
  final VoidCallback onDelete;
  final VoidCallback? onTap;

  const NoteItem({
    super.key,
    required this.note,
    required this.onDelete,
    this.onTap,
  });

  @override
  _NoteItemState createState() => _NoteItemState();
}

class _NoteItemState extends State<NoteItem> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10.0),
      color: AppTheme.surfaceColor,
      elevation: 2,
      child: InkWell(
        onTap: widget.onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  LayoutBuilder(
                    builder: (context, constraints) {
                      // Create a text span with the content
                      final span = TextSpan(
                        text: widget.note.content,
                        style: Theme.of(context).textTheme.bodyMedium,
                      );

                      // Use a TextPainter to determine if the text will overflow
                      final tp = TextPainter(
                        text: span,
                        maxLines: 3,
                        textDirection: TextDirection.ltr,
                      )..layout(maxWidth: constraints.maxWidth);

                      // Check if the text overflows after layout
                      final overflows = tp.didExceedMaxLines;

                      // Only show the button if text overflows or is already expanded
                      final showButton = overflows || _isExpanded;

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text.rich(
                            span,
                            maxLines: _isExpanded ? null : 3,
                            overflow: _isExpanded
                                ? TextOverflow.visible
                                : TextOverflow.ellipsis,
                          ),
                          if (showButton)
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _isExpanded = !_isExpanded;
                                });
                              },
                              style: TextButton.styleFrom(
                                padding: EdgeInsets.zero,
                                minimumSize: const Size(50, 30),
                                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                              ),
                              child: Text(
                                _isExpanded ? 'Show Less' : 'Show More',
                                style: TextStyle(
                                  fontSize: 10,
                                  color: AppTheme.primaryColor,
                                ),
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Page ${widget.note.pageNumber ?? 'Unknown'} • ${DateFormat('MMM d, y').format(widget.note.createdAt!)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondaryColor,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete, size: 20),
                    onPressed: widget.onDelete,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
