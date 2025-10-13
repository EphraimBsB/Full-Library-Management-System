import 'package:json_annotation/json_annotation.dart';

part 'auth_response.g.dart';

@JsonSerializable()
class AuthResponse {
  @JsonKey(name: 'access_token')
  final String accessToken;

  @JsonKey(name: 'user')
  final Map<String, dynamic> userData;

  AuthResponse({required this.accessToken, required this.userData});

  // Getters for commonly used user fields
  String get userId => userData['id'] as String? ?? '';
  String get email => userData['email'] as String? ?? '';
  String get firstName => userData['firstName'] as String? ?? '';
  String get lastName => userData['lastName'] as String? ?? '';
  String get fullName => '$firstName $lastName'.trim();
  String get avatarUrl => userData['avatarUrl'] as String? ?? '';

  // Get role information
  dynamic get role => userData['role'];
  String get roleName =>
      (userData['role'] is Map
          ? (userData['role']?['name'] as String?)
          : userData['role'] as String?) ??
      '';
  List<String> get permissions {
    final role = userData['role'];
    if (role is Map) {
      final permissions = role['permissions'] as List?;
      if (permissions != null) {
        return permissions.whereType<String>().toList();
      }
    }
    return [];
  }

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);

  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}
