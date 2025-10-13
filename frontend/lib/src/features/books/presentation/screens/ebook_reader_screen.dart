import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:management_side/src/features/auth/utils/token_storage.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import 'package:http/io_client.dart' as http_io;

class CustomHttpClient {
  final http.Client _client;
  final String? _authToken;

  CustomHttpClient(this._client, this._authToken);

  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    if (_authToken != null) {
      request.headers['Authorization'] = 'Bearer $_authToken';
    }
    return _client.send(request);
  }

  void close() {
    _client.close();
  }
}

class EbookReaderScreen extends StatefulWidget {
  final String bookTitle;
  final String ebookUrl;

  const EbookReaderScreen({
    super.key,
    required this.bookTitle,
    required this.ebookUrl,
  });

  @override
  _EbookReaderScreenState createState() => _EbookReaderScreenState();
}

class _EbookReaderScreenState extends State<EbookReaderScreen> {
  final PdfViewerController _pdfViewerController = PdfViewerController();
  final TextEditingController _noteController = TextEditingController();
  final List<Map<String, dynamic>> _notes = [];
  bool _isNoteVisible = false;
  int? _currentPageNumber;

  @override
  void dispose() {
    _pdfViewerController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  void _addNote() {
    if (_noteController.text.isNotEmpty && _currentPageNumber != null) {
      setState(() {
        _notes.add({
          'page': _currentPageNumber! + 1, // +1 because pages are 0-indexed
          'text': _noteController.text,
          'dateTime': DateTime.now(),
        });
        _noteController.clear();
      });
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
            border: OutlineInputBorder(),
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
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.bookTitle, style: const TextStyle(fontSize: 20)),
        actions: [
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
              future: _loadPdfWithAuth(widget.ebookUrl),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.done) {
                  if (snapshot.hasData) {
                    return SfPdfViewer.network(
                      widget.ebookUrl,
                      controller: _pdfViewerController,
                    );
                  } else if (snapshot.hasError) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.error_outline,
                            color: Colors.red,
                            size: 60,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Failed to load PDF: ${snapshot.error}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 16),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () => setState(() {}),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
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
                  if (_notes.isNotEmpty)
                    Expanded(
                      child: ListView.builder(
                        itemCount: _notes.length,
                        itemBuilder: (context, index) {
                          final note = _notes[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 8.0),
                            child: ListTile(
                              title: Text(note['text']),
                              subtitle: Text(
                                'Page ${note['page']} • ${note['dateTime'].toString().substring(0, 16)}',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete, size: 20),
                                onPressed: () {
                                  setState(() {
                                    _notes.removeAt(index);
                                  });
                                },
                              ),
                            ),
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
}
