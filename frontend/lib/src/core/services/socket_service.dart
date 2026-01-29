import 'dart:async';
import 'package:logger/logger.dart';
import 'package:management_side/src/core/config/env_config.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  final _logger = Logger();
  io.Socket? _socket;
  final _controller = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get notifications => _controller.stream;

  void connect(String token) {
    if (_socket?.connected ?? false) return;

    final baseUrl = EnvConfig.baseUrl.replaceAll('/api/v1', '');
    _logger.i('Connecting to WebSocket at $baseUrl');

    _socket = io.io(baseUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'auth': {'token': token},
    });

    _socket!.connect();

    _socket!.onConnect((_) {
      _logger.i('Connected to WebSocket');
    });

    _socket!.onDisconnect((_) {
      _logger.i('Disconnected from WebSocket');
    });

    _socket!.on('notification', (data) {
      _logger.i('Received notification: $data');
      if (data is Map<String, dynamic>) {
        _controller.add(data);
      }
    });

    _socket!.onError((err) {
      _logger.e('WebSocket Error: $err');
    });
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  void dispose() {
    disconnect();
    _controller.close();
  }
}
