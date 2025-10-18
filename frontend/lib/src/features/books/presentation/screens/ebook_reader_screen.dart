import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:management_side/src/features/auth/utils/token_storage.dart';
import 'package:management_side/src/features/books/presentation/providers/book_list_providers.dart';
import 'package:management_side/src/features/books/presentation/widgets/note_item.dart';
import 'package:management_side/src/features/student/domain/models/book_notes_model.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:http/io_client.dart' as http_io;

class EbookReaderScreen extends ConsumerStatefulWidget {
  final String bookTitle;
  final String ebookUrl;
  final int bookId;

  const EbookReaderScreen({
    super.key,
    required this.bookTitle,
    required this.ebookUrl,
    required this.bookId,
  });

  @override
  ConsumerState<EbookReaderScreen> createState() => _EbookReaderScreenState();
}

class _EbookReaderScreenState extends ConsumerState<EbookReaderScreen> {
  final PdfViewerController _pdfViewerController = PdfViewerController();
  final TextEditingController _noteController = TextEditingController();
  // final List<Map<String, dynamic>> _notes = [];
  bool _isNoteVisible = false;

  int? _currentPageNumber;

  late Future<Uint8List> _pdfFuture;

  @override
  void initState() {
    super.initState();
    _pdfFuture = _loadPdfWithAuth(widget.ebookUrl); // ✅ only once
  }

  @override
  void dispose() {
    _pdfViewerController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _addNote() async {
    print('Creating note: $_currentPageNumber');
    if (_noteController.text.isEmpty || _currentPageNumber == null) {
      if (_currentPageNumber == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please wait for the PDF to load')),
        );
      }
      return;
    }

    try {
      final note = BookNote(
        bookId: widget.bookId,
        pageNumber: _currentPageNumber!,
        content: _noteController.text,
        isPublic: false,
      );

      await ref.read(createBookNoteProvider(note).future);

      // Clear the text field and close the dialog
      _noteController.clear();
      if (mounted) {
        // Navigator.pop(context);
        //refresh the notes
        ref.invalidate(bookNotesProvider(widget.bookId));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to create note: ${e.toString()}')),
        );
      }
    }
  }

  void _showNoteDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Note'),
        content: TextField(
          controller: _noteController,
          maxLines: 4,
          decoration: const InputDecoration(
            hintText: 'Type your note here...',
            border: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.black),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              _addNote();
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _showNoteDialogWithSelectedText(String selectedText) async {
    _noteController.text = selectedText;
    _showNoteDialog();
  }

  void _highlightPageTemporarily(int pageNumber) async {
    // Show a temporary overlay color flash
    OverlayEntry? overlay;

    overlay = OverlayEntry(
      builder: (context) => Positioned.fill(
        child: Container(color: Colors.yellow.withOpacity(0.2)),
      ),
    );

    Overlay.of(context).insert(overlay!);

    await Future.delayed(const Duration(milliseconds: 400));
    overlay?.remove();
  }

  Future<Uint8List> _loadPdfWithAuth(String url) async {
    final token = await TokenStorage().getToken();

    final headers = {'Authorization': 'Bearer $token'};

    if (kIsWeb) {
      // ✅ Web: use standard http client
      final response = await http.get(Uri.parse(url), headers: headers);
      if (response.statusCode == 200) {
        return response.bodyBytes;
      } else {
        throw Exception('Failed to load PDF: ${response.statusCode}');
      }
    } else {
      // ✅ Desktop/Mobile: use IOClient (supports self-signed certs, etc.)
      final client = http_io.IOClient();
      try {
        final response = await client.get(Uri.parse(url), headers: headers);
        if (response.statusCode == 200) {
          return response.bodyBytes;
        } else {
          throw Exception('Failed to load PDF: ${response.statusCode}');
        }
      } finally {
        client.close();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final notes = ref.watch(bookNotesProvider(widget.bookId));
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.bookTitle, style: const TextStyle(fontSize: 20)),
        actions: [
          if (_currentPageNumber != null)
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Text(
                'Page $_currentPageNumber',
                style: const TextStyle(fontSize: 12, color: Colors.white),
              ),
            ),
          IconButton(
            icon: const Icon(Icons.bookmark_add),
            onPressed: _showNoteDialog,
            tooltip: 'Add Note',
          ),
          IconButton(
            icon: Icon(_isNoteVisible ? Icons.notes : Icons.notes_outlined),
            onPressed: () => setState(() => _isNoteVisible = !_isNoteVisible),
            tooltip: 'Show/Hide Notes',
          ),
        ],
      ),
      body: Row(
        children: [
          // PDF Viewer
          Expanded(
            child: FutureBuilder<Uint8List>(
              future: _pdfFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.done) {
                  if (snapshot.hasData) {
                    return SfPdfViewer.memory(
                      snapshot.data!,
                      controller: _pdfViewerController,
                      enableTextSelection: true,
                      canShowTextSelectionMenu: true,
                      onDocumentLoaded: (PdfDocumentLoadedDetails details) {
                        if (_currentPageNumber == null) {
                          // ✅ only update once
                          setState(() {
                            _currentPageNumber =
                                _pdfViewerController.pageNumber;
                          });
                        }
                      },
                      onPageChanged: (details) {
                        setState(() {
                          _currentPageNumber = details.newPageNumber;
                        });
                      },
                      onTextSelectionChanged:
                          (PdfTextSelectionChangedDetails details) {
                            if (details.selectedText != null &&
                                details.selectedText!.isNotEmpty) {
                              _showAddNoteMenu(details);
                            }
                          },
                    );
                  } else if (snapshot.hasError) {
                    return Center(
                      child: Text('Failed to load PDF: ${snapshot.error}'),
                    );
                  }
                }
                return const Center(child: CircularProgressIndicator());
              },
            ),
          ),

          // Notes Panel
          if (_isNoteVisible)
            Container(
              width: 300,
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                border: Border(left: BorderSide(color: Colors.grey.shade300)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8.0),
                    child: Text(
                      'My Notes',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  if (notes.value?.isNotEmpty ?? false)
                    Expanded(
                      child: ListView.builder(
                        itemCount: notes.value?.length ?? 0,
                        itemBuilder: (context, index) {
                          final note = notes.value![index];
                          return NoteItem(
                            note: note,
                            onDelete: () async {
                              try {
                                await ref.read(
                                  deleteBookNoteProvider(note.id!).future,
                                );
                                // Invalidate the provider to refresh the list
                                ref.invalidate(
                                  bookNotesProvider(widget.bookId),
                                );
                              } catch (e) {
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Failed to delete note'),
                                    ),
                                  );
                                }
                              }
                            },
                            onTap: () {
                              _pdfViewerController.jumpToPage(note.pageNumber!);
                              _highlightPageTemporarily(note.pageNumber!);
                            },
                          );
                        },
                      ),
                    )
                  else
                    const Expanded(
                      child: Center(
                        child: Text(
                          'No notes yet. Add a note by clicking the bookmark icon.',
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _showAddNoteMenu(PdfTextSelectionChangedDetails details) {
    if (!mounted) return;

    final overlay = Overlay.of(context);
    if (overlay == null) return;

    final renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox == null) return;

    final Offset globalPosition = renderBox.localToGlobal(Offset.zero);

    late OverlayEntry overlayEntry;
    overlayEntry = OverlayEntry(
      builder: (context) => Positioned(
        top: (details.globalSelectedRegion?.top ?? globalPosition.dy) - 40,
        left: details.globalSelectedRegion?.left ?? 50,
        child: Material(
          color: Colors.transparent,
          child: GestureDetector(
            onTap: () async {
              final selectedText = details.selectedText ?? '';
              _pdfViewerController.clearSelection();

              if (overlayEntry.mounted) {
                try {
                  overlayEntry.remove();
                } catch (_) {}
              }

              await _showNoteDialogWithSelectedText(selectedText);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.orange.shade700,
                borderRadius: BorderRadius.circular(6),
                boxShadow: const [
                  BoxShadow(color: Colors.black26, blurRadius: 4),
                ],
              ),
              child: const Text(
                '➕ Add to Notes',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ),
        ),
      ),
    );

    overlay.insert(overlayEntry);

    // Remove after 3 seconds (safely)
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && overlayEntry.mounted) {
        try {
          overlayEntry.remove();
        } catch (_) {}
      }
    });
  }
}
