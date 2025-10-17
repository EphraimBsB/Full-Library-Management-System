import 'package:json_annotation/json_annotation.dart';
import 'package:management_side/src/features/auth/domain/models/user_model.dart';

part 'auth_response.g.dart';

@JsonSerializable()
class AuthResponse {
  @JsonKey(name: 'access_token')
  final String accessToken;

  @JsonKey(name: 'refresh_token')
  final String? refreshToken;

  @JsonKey(name: 'user')
  final Map<String, dynamic> userData;

  AuthResponse({
    required this.accessToken,
    this.refreshToken,
    required this.userData,
  });

  // Getters for commonly used user fields
  String get userId => userData['id'];
  String get email => userData['email'];
  String get firstName => userData['firstName'];
  String get lastName => userData['lastName'];
  String get fullName => '$firstName $lastName'.trim();
  String get avatarUrl => userData['avatarUrl'] ?? '';

  // Get role information
  dynamic get role => userData['role'];
  String get roleName => userData['role']['name'] ?? '';
  List<String> get permissions {
    final role = userData['role'];
    if (role != null) {
      final permissions = role['permissions'];
      return permissions.whereType<String>().toList();
    }
    return [];
  }

  factory AuthResponse.fromJson(Map<String, dynamic> json) =>
      _$AuthResponseFromJson(json);

  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}
