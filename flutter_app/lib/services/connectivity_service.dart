import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'storage_service.dart';
import 'api_service.dart';

/// Service for monitoring network connectivity and syncing offline data
class ConnectivityService {
  static ConnectivityService? _instance;
  final Connectivity _connectivity = Connectivity();
  final StorageService _storage = StorageService();
  final ApiService _api = ApiService();

  StreamSubscription<List<ConnectivityResult>>? _subscription;
  bool _isOnline = true;

  /// Callbacks for connectivity changes
  final List<Function(bool)> _listeners = [];

  ConnectivityService._internal();

  factory ConnectivityService() {
    _instance ??= ConnectivityService._internal();
    return _instance!;
  }

  bool get isOnline => _isOnline;

  /// Initialize connectivity monitoring
  Future<void> initialize() async {
    await _storage.initialize();

    // Check initial connectivity
    final results = await _connectivity.checkConnectivity();
    _isOnline = !results.contains(ConnectivityResult.none);

    // Listen for changes (new API returns List<ConnectivityResult>)
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      final wasOnline = _isOnline;
      _isOnline = !results.contains(ConnectivityResult.none);

      if (!wasOnline && _isOnline) {
        print('📶 Back online - syncing offline data...');
        _syncOfflineQueue();
      }

      // Notify listeners
      for (final listener in _listeners) {
        listener(_isOnline);
      }
    });
  }

  /// Add connectivity listener
  void addListener(Function(bool) listener) {
    _listeners.add(listener);
  }

  /// Remove connectivity listener
  void removeListener(Function(bool) listener) {
    _listeners.remove(listener);
  }

  /// Sync offline queue when back online
  Future<void> _syncOfflineQueue() async {
    final queue = _storage.getOfflineQueue();
    if (queue.isEmpty) return;

    print('📤 Syncing ${queue.length} offline operations...');

    for (int i = 0; i < queue.length; i++) {
      final operation = queue[i];
      try {
        await _executeOperation(operation);
        await _storage.removeFromOfflineQueue(0);
        print('✅ Synced: ${operation['type']}');
      } catch (e) {
        print('❌ Failed to sync: ${operation['type']} - $e');
        break;
      }
    }
  }

  /// Execute a queued operation
  Future<void> _executeOperation(Map<String, dynamic> operation) async {
    final type = operation['type'];
    final data = operation['data'];
    final endpoint = operation['endpoint'];

    switch (type) {
      case 'POST':
        await _api.post(endpoint, data: data);
        break;
      case 'PUT':
        await _api.put(endpoint, data: data);
        break;
      case 'DELETE':
        await _api.delete(endpoint);
        break;
    }
  }

  /// Queue an operation for offline sync
  Future<void> queueOperation({
    required String type,
    required String endpoint,
    Map<String, dynamic>? data,
  }) async {
    await _storage.addToOfflineQueue({
      'type': type,
      'endpoint': endpoint,
      'data': data,
    });
  }

  /// Dispose
  void dispose() {
    _subscription?.cancel();
    _listeners.clear();
  }
}
