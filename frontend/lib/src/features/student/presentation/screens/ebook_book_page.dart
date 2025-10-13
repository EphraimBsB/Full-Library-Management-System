// import 'package:flutter/material.dart';
// import 'package:management_side/src/features/auth/utils/token_storage.dart';
// import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
// import 'package:http/http.dart' as http;
// import 'package:management_side/src/features/auth/utils/dummy_user_token.dart';

// class EbookReaderPage extends StatefulWidget {
//   final String bookTitle;
//   final String ebookUrl;

//   const EbookReaderPage({
//     super.key,
//     required this.bookTitle,
//     required this.ebookUrl,
//   });

//   @override
//   State<EbookReaderPage> createState() => _EbookReaderPageState();
// }

// class _EbookReaderPageState extends State<EbookReaderPage> {
//   final GlobalKey<SfPdfViewerState> _pdfViewerKey = GlobalKey();
//   bool _isLoading = true;
//   String? _error;
//   late final Future<Map<String, String>> _pdfFuture;

//   @override
//   void initState() {
//     super.initState();
//     _pdfFuture = _loadPdfWithAuth();
//   }

//   Future<Map<String, String>> _loadPdfWithAuth() async {
//     try {
//       final token = await tokenStorage.getToken();
//       final headers = {
//         'Authorization': 'Bearer $token',
//         'Accept': 'application/pdf',
//       };

//       // Check if the URL is valid
//       if (widget.ebookUrl.isEmpty) {
//         throw Exception('Invalid PDF URL');
//       }

//       // Verify the PDF is accessible
//       final response = await http.get(
//         Uri.parse(widget.ebookUrl),
//         headers: headers,
//       );

//       if (response.statusCode != 200) {
//         throw Exception('Failed to load PDF: ${response.statusCode}');
//       }

//       return {
//         'url': widget.ebookUrl,
//         'headers': headers.entries.map((e) => '${e.key}=${e.value}').join('&'),
//       };
//     } catch (e) {
//       setState(() => _error = e.toString());
//       rethrow;
//     } finally {
//       if (mounted) {
//         setState(() => _isLoading = false);
//       }
//     }
//   }

//   @override
//   Widget build(BuildContext context) {
//     return Scaffold(
//       appBar: AppBar(
//         elevation: 0.0,
//         iconTheme: const IconThemeData(color: Colors.black),
//         backgroundColor: Colors.grey.shade300,
//         title: Text(
//           widget.bookTitle,
//           style: const TextStyle(color: Colors.black),
//           maxLines: 1,
//           overflow: TextOverflow.ellipsis,
//         ),
//         centerTitle: true,
//         actions: <Widget>[
//           IconButton(
//             icon: const Icon(Icons.bookmark, semanticLabel: 'Bookmark'),
//             onPressed: () {
//               _pdfViewerKey.currentState?.openBookmarkView();
//             },
//           ),
//         ],
//       ),
//       body: FutureBuilder<Map<String, String>>(
//         future: _pdfFuture,
//         builder: (context, snapshot) {
//           if (_isLoading) {
//             return const Center(child: CircularProgressIndicator());
//           }

//           if (_error != null || snapshot.hasError) {
//             return Center(
//               child: Column(
//                 mainAxisAlignment: MainAxisAlignment.center,
//                 children: [
//                   const Icon(Icons.error_outline, color: Colors.red, size: 48),
//                   const SizedBox(height: 16),
//                   Text(
//                     'Failed to load PDF',
//                     style: Theme.of(context).textTheme.titleLarge,
//                   ),
//                   const SizedBox(height: 8),
//                   Text(
//                     _error ?? snapshot.error.toString(),
//                     textAlign: TextAlign.center,
//                     style: Theme.of(context).textTheme.bodyMedium,
//                   ),
//                   const SizedBox(height: 16),
//                   ElevatedButton(
//                     onPressed: () => setState(() {
//                       _isLoading = true;
//                       _error = null;
//                       _pdfFuture = _loadPdfWithAuth();
//                     }),
//                     child: const Text('Retry'),
//                   ),
//                 ],
//               ),
//             );
//           }

//           if (snapshot.hasData) {
//             return SfPdfViewer.network(
//               'https://cdn.syncfusion.com/content/PDFViewer/flutter-succinctly.pdf',
//               key: _pdfViewerKey,
//               headers: {'Authorization': 'Bearer ${snapshot.data!['token']}'},
//               initialScrollOffset: const Offset(0, 0),
//               canShowScrollHead: true,
//               canShowScrollStatus: true,
//               onDocumentLoadFailed: (PdfDocumentLoadFailedDetails details) {
//                 setState(() {
//                   _error = details.error.toString();
//                 });
//               },
//             );
//           }

//           return const Center(child: Text('No PDF document found.'));
//         },
//       ),
//     );
//   }
// }
