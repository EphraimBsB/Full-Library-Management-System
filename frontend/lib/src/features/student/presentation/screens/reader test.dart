// import 'package:flutter/material.dart';
// import 'package:management_side/src/features/auth/utils/token_storage.dart';
// import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
// import 'package:http/http.dart' as http;
// import 'dart:typed_data';

// class ReaderTest extends StatefulWidget {
//   const ReaderTest({super.key, this.ebookUrl});

//   final String? ebookUrl;

//   @override
//   _ReaderTestState createState() => _ReaderTestState();
// }

// class _ReaderTestState extends State<ReaderTest> {
//   final GlobalKey<SfPdfViewerState> _pdfViewerKey = GlobalKey();
//   bool _isLoading = true;
//   String? _errorMessage;
//   Uint8List? _pdfBytes;

//   @override
//   void initState() {
//     super.initState();
//     _loadPdf();
//   }

//   Future<void> _loadPdf() async {
//     setState(() {
//       _isLoading = true;
//       _errorMessage = null;
//     });

//     try {
//       final url =
//           widget.ebookUrl ??
//           'https://cdn.syncfusion.com/content/PDFViewer/flutter-succinctly.pdf';

//       final response = await http.get(
//         Uri.parse(url),
//         headers: {
//           'Authorization': 'Bearer ${await tokenStorage.getToken()}',
//           'Accept': 'application/pdf',
//         },
//       );

//       if (response.statusCode == 200) {
//         setState(() {
//           _pdfBytes = response.bodyBytes;
//           _isLoading = false;
//         });
//       } else {
//         throw Exception('Failed to load PDF: ${response.statusCode}');
//       }
//     } catch (e) {
//       setState(() {
//         _errorMessage = 'Error loading PDF: $e';
//         _isLoading = false;
//       });
//       debugPrint('PDF Error: $e');
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         title: const Text('PDF Viewer'),
//         actions: <Widget>[
//           IconButton(
//             icon: const Icon(Icons.refresh),
//             onPressed: _loadPdf,
//             tooltip: 'Reload PDF',
//           ),
//           IconButton(
//             icon: const Icon(Icons.bookmark),
//             onPressed: () {
//               _pdfViewerKey.currentState?.openBookmarkView();
//             },
//           ),
//         ],
//       ),
//       body: _buildBody(),
//     );
//   }

//   Widget _buildBody() {
//     if (_isLoading) {
//       return const Center(child: CircularProgressIndicator());
//     }

//     if (_errorMessage != null) {
//       return Center(
//         child: Padding(
//           padding: const EdgeInsets.all(16.0),
//           child: Column(
//             mainAxisAlignment: MainAxisAlignment.center,
//             children: [
//               const Icon(Icons.error_outline, color: Colors.red, size: 48),
//               const SizedBox(height: 16),
//               const Text(
//                 'Failed to load PDF',
//                 style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
//               ),
//               const SizedBox(height: 8),
//               Text(
//                 _errorMessage!,
//                 textAlign: TextAlign.center,
//                 style: const TextStyle(color: Colors.red),
//               ),
//               const SizedBox(height: 16),
//               ElevatedButton(onPressed: _loadPdf, child: const Text('Retry')),
//             ],
//           ),
//         ),
//       );
//     }

//     if (_pdfBytes != null) {
//       return SfPdfViewer.memory(
//         _pdfBytes!,
//         key: _pdfViewerKey,
//         canShowScrollHead: true,
//         canShowScrollStatus: true,
//         onDocumentLoadFailed: (PdfDocumentLoadFailedDetails details) {
//           setState(() {
//             _errorMessage = 'Failed to load PDF: ${details.error}';
//           });
//           debugPrint('PDF Error: ${details.error}');
//           debugPrint('Description: ${details.description}');
//         },
//       );
//     }

//     return const Center(child: Text('No PDF document available.'));
//   }
// }
