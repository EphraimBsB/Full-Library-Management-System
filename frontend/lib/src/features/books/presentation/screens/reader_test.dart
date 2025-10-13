import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';

class ReaderTest extends StatefulWidget {
  const ReaderTest({super.key});

  @override
  _ReaderTestState createState() => _ReaderTestState();
}

class _ReaderTestState extends State<ReaderTest> {
  final GlobalKey<SfPdfViewerState> _pdfViewerKey = GlobalKey();
  bool _isLoading = true;
  String? _errorMessage;

  // Use different PDFs for testing web vs desktop
  String get _pdfUrl {
    if (kIsWeb) {
      // For web, use a CORS-enabled URL
      return 'https://www.africau.edu/images/default/sample.pdf';
    } else {
      // For desktop, you can use any URL or local file
      return 'https://cdn.syncfusion.com/content/PDFViewer/flutter-succinctly.pdf';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PDF Viewer'),
        actions: <Widget>[
          IconButton(
            icon: const Icon(Icons.bookmark, color: Colors.white),
            onPressed: () {
              _pdfViewerKey.currentState?.openBookmarkView();
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          SfPdfViewer.network(
            _pdfUrl,
            key: _pdfViewerKey,
            onDocumentLoadFailed: (PdfDocumentLoadFailedDetails details) {
              setState(() {
                _isLoading = false;
                _errorMessage = 'Failed to load PDF: ${details.error}';
              });
              debugPrint('PDF Error: ${details.error}');
              debugPrint('Description: ${details.description}');
            },
            onDocumentLoaded: (PdfDocumentLoadedDetails details) {
              setState(() {
                _isLoading = false;
              });
              debugPrint('PDF loaded successfully');
            },
          ),
          if (_isLoading) const Center(child: CircularProgressIndicator()),
          if (_errorMessage != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Text(
                  _errorMessage!,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
