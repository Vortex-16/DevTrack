import '../config/api_config.dart';
import '../models/log_entry.dart';
import 'api_service.dart';

/// Service for learning log operations
class LogService {
  final ApiService _api = ApiService();

  /// Get all logs with pagination
  Future<List<LogEntry>> getLogs({int page = 1, int limit = 20}) async {
    try {
      final response = await _api.get(
        ApiEndpoints.logs,
        queryParameters: {'page': page, 'limit': limit},
      );

      final data = response.data;

      // Backend returns { success: true, data: { logs: [...], pagination: {...} } }
      List<dynamic> logsData = [];
      if (data is Map) {
        if (data['data'] != null && data['data']['logs'] != null) {
          logsData = data['data']['logs'];
        } else if (data['logs'] != null) {
          logsData = data['logs'];
        } else if (data['data'] is List) {
          logsData = data['data'];
        }
      } else if (data is List) {
        logsData = data;
      }

      return logsData.map((json) => LogEntry.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching logs: $e');
      return [];
    }
  }

  /// Get a single log entry
  Future<LogEntry?> getLog(String id) async {
    try {
      final response = await _api.get('${ApiEndpoints.logs}/$id');
      final data = response.data;

      if (data is Map) {
        final logData = data['data'] ?? data['log'] ?? data;
        return LogEntry.fromJson(logData);
      }
      return null;
    } catch (e) {
      print('Error fetching log: $e');
      return null;
    }
  }

  /// Create a new log entry
  Future<LogEntry?> createLog(Map<String, dynamic> logData) async {
    try {
      final response = await _api.post(ApiEndpoints.logs, data: logData);
      final data = response.data;

      if (data is Map) {
        final log = data['data'] ?? data['log'] ?? data;
        return LogEntry.fromJson(log);
      }
      return null;
    } catch (e) {
      print('Error creating log: $e');
      return null;
    }
  }

  /// Update a log entry
  Future<LogEntry?> updateLog(String id, Map<String, dynamic> logData) async {
    try {
      final response =
          await _api.put('${ApiEndpoints.logs}/$id', data: logData);
      final data = response.data;

      if (data is Map) {
        final log = data['data'] ?? data['log'] ?? data;
        return LogEntry.fromJson(log);
      }
      return null;
    } catch (e) {
      print('Error updating log: $e');
      return null;
    }
  }

  /// Delete a log entry
  Future<bool> deleteLog(String id) async {
    try {
      await _api.delete('${ApiEndpoints.logs}/$id');
      return true;
    } catch (e) {
      print('Error deleting log: $e');
      return false;
    }
  }

  /// Get log statistics
  Future<LogStats?> getStats() async {
    try {
      final response = await _api.get(ApiEndpoints.logsStats);
      final data = response.data;

      if (data is Map) {
        // Backend returns { success: true, data: { totalLogs: 10, ... } }
        final statsData = data['data'] ?? data['stats'] ?? data;
        return LogStats.fromJson(Map<String, dynamic>.from(statsData));
      }
      return null;
    } catch (e) {
      print('Error fetching log stats: $e');
      return null;
    }
  }
}
