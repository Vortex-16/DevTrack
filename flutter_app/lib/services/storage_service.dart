import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

/// Local storage service for offline support and caching
class StorageService {
  static StorageService? _instance;
  SharedPreferences? _prefs;

  StorageService._internal();

  factory StorageService() {
    _instance ??= StorageService._internal();
    return _instance!;
  }

  /// Initialize storage
  Future<void> initialize() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // ==================== GENERIC METHODS ====================

  /// Save string
  Future<bool> setString(String key, String value) async {
    return await _prefs?.setString(key, value) ?? false;
  }

  /// Get string
  String? getString(String key) {
    return _prefs?.getString(key);
  }

  /// Save bool
  Future<bool> setBool(String key, bool value) async {
    return await _prefs?.setBool(key, value) ?? false;
  }

  /// Get bool
  bool? getBool(String key) {
    return _prefs?.getBool(key);
  }

  /// Save int
  Future<bool> setInt(String key, int value) async {
    return await _prefs?.setInt(key, value) ?? false;
  }

  /// Get int
  int? getInt(String key) {
    return _prefs?.getInt(key);
  }

  /// Save JSON object
  Future<bool> setJson(String key, Map<String, dynamic> value) async {
    return await _prefs?.setString(key, jsonEncode(value)) ?? false;
  }

  /// Get JSON object
  Map<String, dynamic>? getJson(String key) {
    final str = _prefs?.getString(key);
    if (str == null) return null;
    try {
      return jsonDecode(str) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  /// Save JSON list
  Future<bool> setJsonList(String key, List<Map<String, dynamic>> value) async {
    return await _prefs?.setString(key, jsonEncode(value)) ?? false;
  }

  /// Get JSON list
  List<Map<String, dynamic>>? getJsonList(String key) {
    final str = _prefs?.getString(key);
    if (str == null) return null;
    try {
      final list = jsonDecode(str) as List;
      return list.map((e) => Map<String, dynamic>.from(e)).toList();
    } catch (_) {
      return null;
    }
  }

  /// Remove key
  Future<bool> remove(String key) async {
    return await _prefs?.remove(key) ?? false;
  }

  /// Clear all
  Future<bool> clear() async {
    return await _prefs?.clear() ?? false;
  }

  // ==================== CACHE KEYS ====================

  static const String keyUserCache = 'cache_user';
  static const String keyLogsCache = 'cache_logs';
  static const String keyProjectsCache = 'cache_projects';
  static const String keyTasksCache = 'cache_tasks';
  static const String keyStatsCache = 'cache_stats';
  static const String keyBookmarksCache = 'cache_bookmarks';
  static const String keySavedIdeasCache = 'cache_saved_ideas';
  static const String keyLastSync = 'last_sync';
  static const String keyOfflineQueue = 'offline_queue';

  // ==================== CACHE METHODS ====================

  /// Cache user data
  Future<void> cacheUser(Map<String, dynamic> user) async {
    await setJson(keyUserCache, user);
  }

  /// Get cached user
  Map<String, dynamic>? getCachedUser() {
    return getJson(keyUserCache);
  }

  /// Cache logs  
  Future<void> cacheLogs(List<Map<String, dynamic>> logs) async {
    await setJsonList(keyLogsCache, logs);
    await setInt(keyLastSync, DateTime.now().millisecondsSinceEpoch);
  }

  /// Get cached logs
  List<Map<String, dynamic>>? getCachedLogs() {
    return getJsonList(keyLogsCache);
  }

  /// Cache projects
  Future<void> cacheProjects(List<Map<String, dynamic>> projects) async {
    await setJsonList(keyProjectsCache, projects);
  }

  /// Get cached projects
  List<Map<String, dynamic>>? getCachedProjects() {
    return getJsonList(keyProjectsCache);
  }

  /// Cache tasks
  Future<void> cacheTasks(List<Map<String, dynamic>> tasks) async {
    await setJsonList(keyTasksCache, tasks);
  }

  /// Get cached tasks
  List<Map<String, dynamic>>? getCachedTasks() {
    return getJsonList(keyTasksCache);
  }

  /// Cache stats
  Future<void> cacheStats(Map<String, dynamic> stats) async {
    await setJson(keyStatsCache, stats);
  }

  /// Get cached stats
  Map<String, dynamic>? getCachedStats() {
    return getJson(keyStatsCache);
  }

  /// Cache bookmarks
  Future<void> cacheBookmarks(List<Map<String, dynamic>> bookmarks) async {
    await setJsonList(keyBookmarksCache, bookmarks);
  }

  /// Get cached bookmarks
  List<Map<String, dynamic>>? getCachedBookmarks() {
    return getJsonList(keyBookmarksCache);
  }

  /// Cache saved ideas
  Future<void> cacheSavedIdeas(List<Map<String, dynamic>> ideas) async {
    await setJsonList(keySavedIdeasCache, ideas);
  }

  /// Get cached saved ideas
  List<Map<String, dynamic>>? getCachedSavedIdeas() {
    return getJsonList(keySavedIdeasCache);
  }

  /// Check if cache is stale (older than duration)
  bool isCacheStale({Duration maxAge = const Duration(minutes: 5)}) {
    final lastSync = getInt(keyLastSync);
    if (lastSync == null) return true;
    
    final syncTime = DateTime.fromMillisecondsSinceEpoch(lastSync);
    return DateTime.now().difference(syncTime) > maxAge;
  }

  // ==================== OFFLINE QUEUE ====================

  /// Add operation to offline queue
  Future<void> addToOfflineQueue(Map<String, dynamic> operation) async {
    final queue = getJsonList(keyOfflineQueue) ?? [];
    queue.add({
      ...operation,
      'timestamp': DateTime.now().toIso8601String(),
    });
    await setJsonList(keyOfflineQueue, queue);
  }

  /// Get offline queue
  List<Map<String, dynamic>> getOfflineQueue() {
    return getJsonList(keyOfflineQueue) ?? [];
  }

  /// Clear offline queue
  Future<void> clearOfflineQueue() async {
    await remove(keyOfflineQueue);
  }

  /// Remove item from offline queue
  Future<void> removeFromOfflineQueue(int index) async {
    final queue = getJsonList(keyOfflineQueue) ?? [];
    if (index < queue.length) {
      queue.removeAt(index);
      await setJsonList(keyOfflineQueue, queue);
    }
  }
}
