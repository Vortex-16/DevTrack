import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/task.dart';
import '../services/task_service.dart';

/// Task state
class TaskState {
  final List<Task> tasks;
  final bool isLoading;
  final String? error;
  final DateTime selectedDate;

  const TaskState({
    this.tasks = const [],
    this.isLoading = false,
    this.error,
    required this.selectedDate,
  });

  TaskState copyWith({
    List<Task>? tasks,
    bool? isLoading,
    String? error,
    DateTime? selectedDate,
  }) {
    return TaskState(
      tasks: tasks ?? this.tasks,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedDate: selectedDate ?? this.selectedDate,
    );
  }

  /// Get tasks for selected date
  List<Task> get tasksForSelectedDate {
    return tasks.where((task) {
      return task.dueDate.year == selectedDate.year &&
          task.dueDate.month == selectedDate.month &&
          task.dueDate.day == selectedDate.day;
    }).toList();
  }

  /// Get task count for a specific date
  int getTaskCountForDate(DateTime date) {
    return tasks.where((task) {
      return task.dueDate.year == date.year &&
          task.dueDate.month == date.month &&
          task.dueDate.day == date.day;
    }).length;
  }
}

/// Task state notifier
class TaskNotifier extends StateNotifier<TaskState> {
  final TaskService _taskService = TaskService();
  
  TaskNotifier() : super(TaskState(selectedDate: DateTime.now()));

  /// Fetch all tasks
  Future<void> fetchTasks({DateTime? startDate, DateTime? endDate}) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final tasks = await _taskService.getTasks(
        startDate: startDate,
        endDate: endDate,
      );
      state = state.copyWith(
        tasks: tasks,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Fetch tasks for selected date
  Future<void> fetchTasksForDate(DateTime date) async {
    state = state.copyWith(isLoading: true, selectedDate: date);

    try {
      final tasks = await _taskService.getTasksForDate(date);
      // Merge with existing tasks
      final existingTaskIds = tasks.map((t) => t.id).toSet();
      final mergedTasks = [
        ...state.tasks.where((t) => !existingTaskIds.contains(t.id)),
        ...tasks,
      ];
      state = state.copyWith(
        tasks: mergedTasks,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Add a new task
  Future<void> addTask(Task task) async {
    state = state.copyWith(isLoading: true);
    try {
      final newTask = await _taskService.createTask(task.toJson());
      if (newTask != null) {
        state = state.copyWith(
          tasks: [...state.tasks, newTask],
          isLoading: false,
        );
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Update a task
  Future<void> updateTask(String id, Task task) async {
    state = state.copyWith(isLoading: true);
    try {
      final updated = await _taskService.updateTask(id, task.toJson());
      if (updated != null) {
        final tasks = state.tasks.map((t) => t.id == id ? updated : t).toList();
        state = state.copyWith(
          tasks: tasks,
          isLoading: false,
        );
      } else {
        state = state.copyWith(isLoading: false);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Toggle task completion
  Future<void> toggleTaskCompletion(String id) async {
    try {
      final updated = await _taskService.toggleComplete(id);
      if (updated != null) {
        final tasks = state.tasks.map((t) => t.id == id ? updated : t).toList();
        state = state.copyWith(tasks: tasks);
      }
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Delete a task
  Future<void> deleteTask(String id) async {
    try {
      await _taskService.deleteTask(id);
      state = state.copyWith(
        tasks: state.tasks.where((t) => t.id != id).toList(),
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Change selected date
  void changeSelectedDate(DateTime date) {
    state = state.copyWith(selectedDate: date);
    fetchTasksForDate(date);
  }
}

/// Task state provider
final taskStateProvider = StateNotifierProvider<TaskNotifier, TaskState>((ref) {
  return TaskNotifier();
});
