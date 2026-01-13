import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

import '../config/api_config.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'storage_service.dart';

/// Service for synchronizing data between Flutter app and server
/// Ensures Flutter app and web dashboard share the same data
class SyncService {
  static SyncService? _instance;
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();
  final Connectivity _connectivity = Connectivity();

  /// Stream controller for sync status updates
  final _syncStatusController = StreamController<SyncStatus>.broadcast();
  Stream<SyncStatus> get syncStatusStream => _syncStatusController.stream;

  /// Current sync status
  SyncStatus _currentStatus = SyncStatus.idle;
  SyncStatus get currentStatus => _currentStatus;

  /// Last sync time
  DateTime? _lastSyncTime;
  DateTime? get lastSyncTime => _lastSyncTime;

  SyncService._internal();

  factory SyncService() {
    _instance ??= SyncService._internal();
    return _instance!;
  }

  /// Initialize the sync service
  Future<void> initialize() async {
    await _storage.initialize();
    
    // Load last sync time
    final lastSyncStr = _storage.getString('last_full_sync');
    if (lastSyncStr != null) {
      _lastSyncTime = DateTime.tryParse(lastSyncStr);
    }

    // Listen for connectivity changes to sync when back online
    _connectivity.onConnectivityChanged.listen((results) {
      // Check if any connection is available (not none)
      final hasConnection = results.any((r) => r != ConnectivityResult.none);
      if (hasConnection) {
        _processOfflineQueue();
      }
    });
  }

  /// Perform a full sync with the server
  /// Call this on login and app resume
  Future<SyncResult> fullSync() async {
    final isAuth = await _api.isAuthenticated();
    if (!isAuth) {
      return SyncResult(
        success: false,
        message: 'Not authenticated',
        syncedItems: 0,
      );
    }

    _updateStatus(SyncStatus.syncing);
    int syncedItems = 0;

    try {
      // 1. Sync user data
      await _syncUserData();
      syncedItems++;

      // 2. Sync logs
      await _syncLogs();
      syncedItems++;

      // 3. Sync tasks
      await _syncTasks();
      syncedItems++;

      // 4. Sync projects
      await _syncProjects();
      syncedItems++;

      // 5. Sync bookmarks
      await _syncBookmarks();
      syncedItems++;

      // 6. Sync saved ideas
      await _syncSavedIdeas();
      syncedItems++;

      // 7. Process offline queue
      await _processOfflineQueue();

      // Update last sync time
      _lastSyncTime = DateTime.now();
      await _storage.setString('last_full_sync', _lastSyncTime!.toIso8601String());

      _updateStatus(SyncStatus.idle);

      return SyncResult(
        success: true,
        message: 'Sync completed successfully',
        syncedItems: syncedItems,
        lastSyncTime: _lastSyncTime,
      );
    } catch (e) {
      print('❌ Full sync error: $e');
      _updateStatus(SyncStatus.error);

      return SyncResult(
        success: false,
        message: 'Sync failed: ${e.toString()}',
        syncedItems: syncedItems,
      );
    }
  }

  /// Sync user data from server
  Future<User?> _syncUserData() async {
    try {
      final response = await _api.get(ApiEndpoints.authMe);
      final data = response.data;

      if (data['success'] == true && data['user'] != null) {
        final userData = Map<String, dynamic>.from(data['user']);
        await _storage.cacheUser(userData);
        print('✅ User data synced');
        return User.fromJson(userData);
      }
    } catch (e) {
      print('⚠️ User sync error: $e');
    }
    return null;
  }

  /// Sync logs from server
  Future<void> _syncLogs() async {
    try {
      final response = await _api.get(ApiEndpoints.logs);
      final data = response.data;

      // Handle nested response: { success: true, data: { logs: [...] } }
      List<dynamic>? logsData;
      if (data['success'] == true) {
        if (data['data'] != null && data['data']['logs'] != null) {
          logsData = data['data']['logs'];
        } else if (data['logs'] != null) {
          logsData = data['logs'];
        }
      }
      
      if (logsData != null) {
        final logs = logsData
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        await _storage.cacheLogs(logs);
        print('✅ Logs synced: ${logs.length} items');
      }
    } catch (e) {
      print('⚠️ Logs sync error: $e');
    }
  }

  /// Sync tasks from server
  Future<void> _syncTasks() async {
    try {
      final response = await _api.get(ApiEndpoints.tasks);
      final data = response.data;

      // Handle nested response: { success: true, data: { tasks: [...] } }
      List<dynamic>? tasksData;
      if (data['success'] == true) {
        if (data['data'] != null && data['data']['tasks'] != null) {
          tasksData = data['data']['tasks'];
        } else if (data['tasks'] != null) {
          tasksData = data['tasks'];
        } else if (data['data'] is List) {
          tasksData = data['data'];
        }
      }
      
      if (tasksData != null) {
        final tasks = tasksData
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        await _storage.cacheTasks(tasks);
        print('✅ Tasks synced: ${tasks.length} items');
      }
    } catch (e) {
      print('⚠️ Tasks sync error: $e');
    }
  }

  /// Sync projects from server
  Future<void> _syncProjects() async {
    try {
      final response = await _api.get(ApiEndpoints.projects);
      final data = response.data;

      // Handle nested response: { success: true, data: { projects: [...] } }
      List<dynamic>? projectsData;
      if (data['success'] == true) {
        if (data['data'] != null && data['data']['projects'] != null) {
          projectsData = data['data']['projects'];
        } else if (data['projects'] != null) {
          projectsData = data['projects'];
        } else if (data['data'] is List) {
          projectsData = data['data'];
        }
      }
      
      if (projectsData != null) {
        final projects = projectsData
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        await _storage.cacheProjects(projects);
        print('✅ Projects synced: ${projects.length} items');
      }
    } catch (e) {
      print('⚠️ Projects sync error: $e');
    }
  }

  /// Sync bookmarks from server
  Future<void> _syncBookmarks() async {
    try {
      final response = await _api.get(ApiEndpoints.bookmarks);
      final data = response.data;

      if (data['success'] == true) {
        final bookmarks = (data['data'] as List)
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        await _storage.cacheBookmarks(bookmarks);
        print('✅ Bookmarks synced: ${bookmarks.length} items');
      }
    } catch (e) {
      print('⚠️ Bookmarks sync error: $e');
    }
  }

  /// Sync saved ideas from server
  Future<void> _syncSavedIdeas() async {
    try {
      final response = await _api.get(ApiEndpoints.savedIdeas);
      final data = response.data;

      if (data['success'] == true) {
        final ideas = (data['data'] as List)
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
        await _storage.cacheSavedIdeas(ideas);
        print('✅ Saved Ideas synced: ${ideas.length} items');
      }
    } catch (e) {
      print('⚠️ Saved Ideas sync error: $e');
    }
  }

  /// Process offline queue - push locally created/updated items to server
  Future<void> _processOfflineQueue() async {
    final queue = _storage.getOfflineQueue();
    if (queue.isEmpty) return;

    print('📤 Processing ${queue.length} offline items...');

    final processedIndices = <int>[];

    for (int i = 0; i < queue.length; i++) {
      final item = queue[i];
      try {
        await _processQueueItem(item);
        processedIndices.add(i);
      } catch (e) {
        print('⚠️ Failed to process queue item $i: $e');
        // Keep item in queue for retry
      }
    }

    // Remove processed items (in reverse to maintain indices)
    for (final index in processedIndices.reversed) {
      await _storage.removeFromOfflineQueue(index);
    }

    if (processedIndices.isNotEmpty) {
      print('✅ Processed ${processedIndices.length} offline items');
    }
  }

  /// Process a single offline queue item
  Future<void> _processQueueItem(Map<String, dynamic> item) async {
    final type = item['type'] as String?;
    final action = item['action'] as String?;
    final data = item['data'] as Map<String, dynamic>?;

    if (type == null || action == null || data == null) {
      throw Exception('Invalid queue item format');
    }

    switch (type) {
      case 'log':
        await _processLogItem(action, data);
        break;
      case 'task':
        await _processTaskItem(action, data);
        break;
      case 'project':
        await _processProjectItem(action, data);
        break;
      case 'bookmark':
        await _processBookmarkItem(action, data);
        break;
      case 'idea':
        await _processIdeaItem(action, data);
        break;
      default:
        throw Exception('Unknown queue item type: $type');
    }
  }

  Future<void> _processLogItem(String action, Map<String, dynamic> data) async {
    switch (action) {
      case 'create':
        await _api.post(ApiEndpoints.logs, data: data);
        break;
      case 'update':
        final id = data['id'];
        await _api.put('${ApiEndpoints.logs}/$id', data: data);
        break;
      case 'delete':
        final id = data['id'];
        await _api.delete('${ApiEndpoints.logs}/$id');
        break;
    }
  }

  Future<void> _processTaskItem(String action, Map<String, dynamic> data) async {
    switch (action) {
      case 'create':
        await _api.post(ApiEndpoints.tasks, data: data);
        break;
      case 'update':
        final id = data['id'];
        await _api.put('${ApiEndpoints.tasks}/$id', data: data);
        break;
      case 'delete':
        final id = data['id'];
        await _api.delete('${ApiEndpoints.tasks}/$id');
        break;
      case 'toggle':
        final id = data['id'];
        await _api.put('${ApiEndpoints.tasks}/$id/toggle', data: data);
        break;
    }
  }

  Future<void> _processProjectItem(String action, Map<String, dynamic> data) async {
    switch (action) {
      case 'create':
        await _api.post(ApiEndpoints.projects, data: data);
        break;
      case 'update':
        final id = data['id'];
        await _api.put('${ApiEndpoints.projects}/$id', data: data);
        break;
      case 'delete':
        final id = data['id'];
        await _api.delete('${ApiEndpoints.projects}/$id');
        break;
    }
  }

  /// Add item to offline queue for later sync
  Future<void> queueOfflineAction({
    required String type,
    required String action,
    required Map<String, dynamic> data,
  }) async {
    await _storage.addToOfflineQueue({
      'type': type,
      'action': action,
      'data': data,
    });
    print('📥 Queued offline action: $type/$action');
  }

  /// Check if we have connectivity
  Future<bool> hasConnectivity() async {
    final results = await _connectivity.checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }

  /// Update sync status
  void _updateStatus(SyncStatus status) {
    _currentStatus = status;
    _syncStatusController.add(status);
  }

  /// Dispose resources
  void dispose() {
    _syncStatusController.close();
  }
}

/// Sync status enum
enum SyncStatus {
  idle,
  syncing,
  error,
}

/// Result of a sync operation
class SyncResult {
  final bool success;
  final String message;
  final int syncedItems;
  final DateTime? lastSyncTime;

  SyncResult({
    required this.success,
    required this.message,
    required this.syncedItems,
    this.lastSyncTime,
  });
}
