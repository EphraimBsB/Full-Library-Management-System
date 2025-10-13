class FileUploadResponse {
  final String id;
  final String url;
  final String originalName;
  final String mimeType;
  final int size;
  final DateTime createdAt;

  FileUploadResponse({
    required this.id,
    required this.url,
    required this.originalName,
    required this.mimeType,
    required this.size,
    required this.createdAt,
  });

  factory FileUploadResponse.fromJson(Map<String, dynamic> json) {
    return FileUploadResponse(
      id: json['id'] as String,
      url: json['url'] as String,
      originalName: json['originalName'] as String,
      mimeType: json['mimeType'] as String,
      size: json['size'] as int,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'url': url,
        'originalName': originalName,
        'mimeType': mimeType,
        'size': size,
        'createdAt': createdAt.toIso8601String(),
      };
}
