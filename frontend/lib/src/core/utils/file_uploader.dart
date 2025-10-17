import 'dart:io';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/core/services/storage_service.dart';

/// A utility class to handle file uploads using Cloudinary
class FileUploader {
  final ImagePicker _picker;
  final StorageService _storageService;

  /// Creates a new FileUploader instance
  FileUploader({ImagePicker? picker, StorageService? storageService})
    : _picker = picker ?? ImagePicker(),
      _storageService = storageService ?? StorageService.create();

  /// The singleton instance of FileUploader
  static final FileUploader instance = FileUploader();

  /// Uploads a file to the server
  /// Returns the URL of the uploaded file
  Future<String> uploadFile(File file, {bool isImage = true}) async {
    try {
      if (kIsWeb) {
        // For web, we need to handle file upload differently
        final bytes = await file.readAsBytes();
        final fileBytes = bytes.buffer.asUint8List();
        final fileName = file.path.split('/').last;

        // Create a FormData object for web
        final formData = FormData.fromMap({
          'file': MultipartFile.fromBytes(fileBytes, filename: fileName),
          'folder': isImage ? 'images' : 'documents',
          'isPublic': 'true',
          'generateThumbnail': isImage.toString(),
        });

        // Use Dio directly for web
        final dio = Dio();
        final response = await dio.post<Map<String, dynamic>>(
          '${ApiConstants.baseUrl}/files/upload',
          data: formData,
          options: Options(headers: {'Content-Type': 'multipart/form-data'}),
          onSendProgress: (sent, total) {
            if (total != -1) {
              final progress = (sent / total * 100).toStringAsFixed(2);
              print('Upload progress: $progress%');
            }
          },
        );

        if (response.data != null && response.data!['url'] != null) {
          return response.data!['url'] as String;
        } else {
          throw ServerException('Invalid response from server');
        }
      } else {
        // For mobile, use the existing implementation
        final response = await StorageService.uploadFileWithProgress(
          file: file,
          folder: isImage ? 'images' : 'documents',
          isPublic: true,
          generateThumbnail: isImage,
          onSendProgress: (sent, total) {
            if (total != -1) {
              final progress = (sent / total * 100).toStringAsFixed(2);
              print('Upload progress: $progress%');
            }
          },
        );
        return response.url;
      }
    } on DioException catch (e) {
      final errorData = e.response?.data;
      final errorMessage = errorData is Map
          ? (errorData['message'] ?? e.message)
          : e.message;

      throw ServerException(errorMessage.toString());
    } catch (e) {
      throw ServerException('Failed to upload file: $e');
    }
  }

  Future<String> uploadFileWeb(
    Uint8List bytes,
    String fileName, {
    bool isImage = true,
  }) async {
    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(bytes, filename: fileName),
      'folder': isImage ? 'images' : 'documents',
      'isPublic': 'true',
      'generateThumbnail': isImage.toString(),
    });

    final dio = Dio();
    final response = await dio.post<Map<String, dynamic>>(
      '${ApiConstants.baseUrl}/files/upload',
      data: formData,
      options: Options(headers: {'Content-Type': 'multipart/form-data'}),
      onSendProgress: (sent, total) {
        if (total != -1) {
          final progress = (sent / total * 100).toStringAsFixed(2);
          print('Upload progress: $progress%');
        }
      },
    );

    if (response.data != null && response.data!['url'] != null) {
      return response.data!['url'] as String;
    } else {
      throw ServerException('Invalid response from server');
    }
  }

  Future<Uint8List?> pickImageBytes() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.image,
      allowMultiple: false,
    );

    if (result != null && result.files.single.bytes != null) {
      return result.files.single.bytes!;
    }
    return null;
  }

  /// Picks an image from the device's gallery
  Future<File?> pickImage() async {
    try {
      final xFile = await _picker.pickImage(
        source: ImageSource.gallery,
        imageQuality: 85,
        maxWidth: 1920, // Limit image size for better performance
      );
      return xFile != null ? File(xFile.path) : null;
    } catch (e) {
      print('Error picking image: $e');
      return null;
    }
  }

  /// Picks a document file from the device's storage
  Future<File?> pickDocument() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'epub'],
        allowMultiple: false,
      );

      if (result != null) {
        if (kIsWeb) {
          // For web, handle the file differently
          if (result.files.single.bytes != null) {
            return File.fromRawPath(
              Uint8List.fromList(result.files.single.bytes!),
            );
          }
          return null;
        } else if (result.files.single.path != null) {
          // For mobile, use the file path
          return File(result.files.single.path!);
        }
      }
      return null;
    } catch (e) {
      print('Error picking document: $e');
      return null;
    }
  }

  /// Uploads an image file and returns its URL
  Future<String> uploadImage(File imageFile) async {
    return uploadFile(imageFile, isImage: true);
  }

  /// Uploads a document file and returns its URL
  Future<String> uploadDocument(File documentFile) async {
    return uploadFile(documentFile, isImage: false);
  }
}
