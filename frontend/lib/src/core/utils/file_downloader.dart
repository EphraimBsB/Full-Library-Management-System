import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:universal_html/html.dart' as html;
import 'package:path_provider/path_provider.dart';

class FileDownloader {
  static final FileDownloader instance = FileDownloader();

  Future<void> downloadFile(
    String url,
    String fileName, {
    String? authToken,
  }) async {
    try {
      final dio = Dio();
      final options = Options(responseType: ResponseType.bytes);

      // Add authorization header if token is provided
      if (authToken != null) {
        options.headers = {'Authorization': 'Bearer $authToken'};
      }

      final response = await dio.get(url, options: options);

      if (kIsWeb) {
        final blob = html.Blob([response.data]);
        final downloadUrl = html.Url.createObjectUrlFromBlob(blob);
        final anchor = html.AnchorElement(href: downloadUrl)
          ..setAttribute('download', fileName)
          ..click();
        html.Url.revokeObjectUrl(downloadUrl);
      } else {
        Directory? directory;
        if (Platform.isAndroid) {
          directory = await getExternalStorageDirectory();
        } else {
          directory = await getApplicationDocumentsDirectory();
        }

        final filePath = '${directory?.path}/$fileName';
        final file = File(filePath);
        await file.writeAsBytes(response.data as List<int>);
        print('File saved to $filePath');
      }
    } catch (e) {
      print('Download error: $e');
      rethrow;
    }
  }
}
