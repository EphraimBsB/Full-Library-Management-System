import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:management_side/src/features/auth/domain/repositories/auth_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl();
});
