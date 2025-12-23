import '../config/api_config.dart';
import '../models/task.dart';
import 'api_service.dart';

/// Service for calendar task operations
class TaskService {
  final ApiService _api = ApiService();

  /// Get all tasks with optional date filter
  Future<List<Task>> getTasks(
      {DateTime? date, DateTime? startDate, DateTime? endDate}) async {
    try {
      Map<String, dynamic> params = {};

      if (date != null) {
        params['date'] = date.toIso8601String().split('T')[0];
      }
      if (startDate != null) {
        params['startDate'] = startDate.toIso8601String().split('T')[0];
      }
      if (endDate != null) {
        params['endDate'] = endDate.toIso8601String().split('T')[0];
      }

      final response = await _api.get(
        ApiEndpoints.tasks,
        queryParameters: params.isNotEmpty ? params : null,
      );

      final data = response.data;

      // Backend returns { success: true, data: { tasks: [...], pagination: {...} } }
      List<dynamic> tasksData = [];
      if (data is Map) {
        if (data['data'] != null && data['data']['tasks'] != null) {
          tasksData = data['data']['tasks'];
        } else if (data['tasks'] != null) {
          tasksData = data['tasks'];
        } else if (data['data'] is List) {
          tasksData = data['data'];
        }
      } else if (data is List) {
        tasksData = data;
      }

      return tasksData.map((json) => Task.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching tasks: $e');
      return [];
    }
  }

  /// Get tasks for a specific date
  Future<List<Task>> getTasksForDate(DateTime date) async {
    try {
      final response = await _api.get(
        ApiEndpoints.tasks,
        queryParameters: {'date': date.toIso8601String().split('T')[0]},
      );

      final data = response.data;

      List<dynamic> tasksData = [];
      if (data is Map) {
        if (data['data'] != null && data['data']['tasks'] != null) {
          tasksData = data['data']['tasks'];
        } else if (data['tasks'] != null) {
          tasksData = data['tasks'];
        } else if (data['data'] is List) {
          tasksData = data['data'];
        }
      } else if (data is List) {
        tasksData = data;
      }

      return tasksData.map((json) => Task.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching tasks for date: $e');
      return [];
    }
  }

  /// Get a single task
  Future<Task?> getTask(String id) async {
    try {
      final response = await _api.get('${ApiEndpoints.tasks}/$id');
      final data = response.data;

      if (data is Map) {
        final task = data['data'] ?? data['task'] ?? data;
        return Task.fromJson(task);
      }
      return null;
    } catch (e) {
      print('Error fetching task: $e');
      return null;
    }
  }

  /// Create a new task
  Future<Task?> createTask(Map<String, dynamic> taskData) async {
    try {
      final response = await _api.post(ApiEndpoints.tasks, data: taskData);
      final data = response.data;

      if (data is Map) {
        final task = data['data'] ?? data['task'] ?? data;
        return Task.fromJson(task);
      }
      return null;
    } catch (e) {
      print('Error creating task: $e');
      return null;
    }
  }

  /// Update a task
  Future<Task?> updateTask(String id, Map<String, dynamic> taskData) async {
    try {
      final response =
          await _api.put('${ApiEndpoints.tasks}/$id', data: taskData);
      final data = response.data;

      if (data is Map) {
        final task = data['data'] ?? data['task'] ?? data;
        return Task.fromJson(task);
      }
      return null;
    } catch (e) {
      print('Error updating task: $e');
      return null;
    }
  }

  /// Toggle task completion
  Future<Task?> toggleComplete(String id) async {
    try {
      final response = await _api.put('${ApiEndpoints.tasks}/$id/toggle');
      final data = response.data;

      if (data is Map) {
        final task = data['data'] ?? data['task'] ?? data;
        return Task.fromJson(task);
      }
      return null;
    } catch (e) {
      print('Error toggling task: $e');
      return null;
    }
  }

  /// Delete a task
  Future<bool> deleteTask(String id) async {
    try {
      await _api.delete('${ApiEndpoints.tasks}/$id');
      return true;
    } catch (e) {
      print('Error deleting task: $e');
      return false;
    }
  }

  /// Get upcoming tasks
  Future<List<Task>> getUpcoming({int limit = 5}) async {
    try {
      final response = await _api.get(
        '${ApiEndpoints.tasks}/upcoming',
        queryParameters: {'limit': limit},
      );

      final data = response.data;

      List<dynamic> tasksData = [];
      if (data is Map) {
        if (data['data'] != null && data['data']['tasks'] != null) {
          tasksData = data['data']['tasks'];
        } else if (data['tasks'] != null) {
          tasksData = data['tasks'];
        } else if (data['data'] is List) {
          tasksData = data['data'];
        }
      } else if (data is List) {
        tasksData = data;
      }

      return tasksData.map((json) => Task.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching upcoming tasks: $e');
      return [];
    }
  }
}
