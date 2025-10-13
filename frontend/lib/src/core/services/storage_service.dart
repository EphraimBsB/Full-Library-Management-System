import 'dart:io';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:retrofit/retrofit.dart';
import 'package:management_side/src/core/error/exceptions.dart';
import 'package:management_side/src/core/network/api_constants.dart';
import 'package:management_side/src/core/network/api_client.dart';
import 'package:management_side/src/core/models/file_upload_response.dart';
import 'package:mime/mime.dart';
import 'package:path/path.dart' as path;
import 'package:http_parser/http_parser.dart';

part 'storage_service.g.dart';

@RestApi(baseUrl: ApiConstants.baseUrl)
@DioResponseType(ResponseType.json)
abstract class StorageService {
  factory StorageService(Dio dio, {String baseUrl}) = _StorageService;

  factory StorageService.create() {
    return StorageService(ApiClient().dio, baseUrl: ApiConstants.baseUrl);
  }

  @POST('/files/upload')
  @MultiPart()
  Future<FileUploadResponse> uploadFile({
    @Part(name: 'file') required File file,
    @Part(name: 'folder') String? folder,
    @Part(name: 'isPublic') bool isPublic = false,
    @Part(name: 'generateThumbnail') bool generateThumbnail = true,
  });

  /// Helper method to upload file with progress callback
  static Future<FileUploadResponse> uploadFileWithProgress({
    required File file,
    String? folder,
    bool isPublic = false,
    bool generateThumbnail = true,
    void Function(int sent, int total)? onSendProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      final fileName = path.basename(file.path);
      final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';

      // Create form data with all fields
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: fileName,
          contentType: MediaType.parse(mimeType),
        ),
        if (folder != null) 'folder': folder,
        'isPublic': isPublic,
        'generateThumbnail': generateThumbnail,
      });

      final dio = ApiClient().dio;

      // Log the request for debugging
      print('Sending file upload request with form data:');
      print('File: ${file.path}');
      print('Folder: $folder');
      print('isPublic: $isPublic');
      print('generateThumbnail: $generateThumbnail');

      final response = await dio.post<Map<String, dynamic>>(
        '${ApiConstants.baseUrl}/files/upload',
        data: formData,
        options: Options(
          headers: {'Content-Type': 'multipart/form-data'},
          validateStatus: (status) => status == 200 || status == 201,
        ),
        onSendProgress: onSendProgress,
        cancelToken: cancelToken,
      );

      // Log the response for debugging
      print('Response status: ${response.statusCode}');
      print('Response data: ${response.data}');

      if (response.data == null) {
        throw const ServerException('Empty response from server');
      }

      return FileUploadResponse.fromJson(response.data!);
    } on DioException catch (e) {
      print('DioException during file upload:');
      print('Error: $e');
      print('Response data: ${e.response?.data}');
      print('Status code: ${e.response?.statusCode}');
      rethrow;
    } catch (e, stackTrace) {
      print('Error in uploadFileWithProgress: $e');
      print('Stack trace: $stackTrace');
      rethrow;
    }
  }

  @GET('/files/{id}')
  @DioResponseType(ResponseType.bytes)
  Future<Uint8List> downloadFile(
    @Path('id') String fileId,
    @Query('variant') String? variant,
  );

  /// Helper method to download file and save it to a specific path
  static Future<File> downloadFileToPath({
    required String fileId,
    required String savePath,
    String? variant,
    void Function(int received, int total)? onReceiveProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      final dio = ApiClient().dio;
      final response = await dio.get<Uint8List>(
        '${ApiConstants.baseUrl}/files/$fileId',
        queryParameters: variant != null ? {'variant': variant} : null,
        options: Options(
          responseType: ResponseType.bytes,
          receiveTimeout: const Duration(minutes: 5),
        ),
        onReceiveProgress: onReceiveProgress,
        cancelToken: cancelToken,
      );

      final file = File(savePath);
      await file.writeAsBytes(response.data!);
      return file;
    } on DioException catch (e) {
      throw ServerException(e.toString());
    } catch (e) {
      throw ServerException('Failed to download file');
    }
  }

  /// Gets a file URL for the given file ID
  /// Optionally specify a variant (e.g., 'thumbnail')
  static String getFileUrl(String fileId, {String? variant}) {
    final baseUrl = ApiConstants.baseUrl.endsWith('/')
        ? ApiConstants.baseUrl
        : '${ApiConstants.baseUrl}/';
    final url = '${baseUrl}files/$fileId';
    return variant != null ? '$url?variant=$variant' : url;
  }

  /// Deletes a file from the server
  @DELETE('/files/{id}')
  Future<void> deleteFile(@Path('id') String fileId);
}
