import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:management_side/src/core/services/navigation_service.dart';
import 'package:management_side/src/core/services/socket_service.dart';
import 'package:management_side/src/features/auth/presentation/providers/auth_state_provider.dart';

final socketServiceProvider = Provider<SocketService>((ref) {
  final service = SocketService();
  ref.onDispose(() => service.dispose());
  return service;
});

final notificationListenerProvider = Provider<void>((ref) {
  final authState = ref.watch(authStateProvider);
  final socketService = ref.read(socketServiceProvider);

  if (authState.authResponse != null) {
    socketService.connect(authState.authResponse!.accessToken);
  } else {
    socketService.disconnect();
  }

  ref.listen(socketServiceProvider.select((s) => s.notifications), (_, next) {
    next.listen((notification) {
      final title = notification['title'] ?? 'Notification';
      final message = notification['message'] ?? '';

      NavigationService.messengerKey.currentState?.showSnackBar(
        SnackBar(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(message),
            ],
          ),
          backgroundColor: Colors.blueAccent,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'DISMISS',
            textColor: Colors.white,
            onPressed: () {
              NavigationService.messengerKey.currentState
                  ?.hideCurrentSnackBar();
            },
          ),
        ),
      );
    });
  });
});
