import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/log_entry.dart';
import '../services/log_service.dart';

/// Log entries state
class LogState {
  final List<LogEntry> entries;
  final LogStats? stats;
  final bool isLoading;
  final String? error;
  final int currentPage;
  final bool hasMore;

  const LogState({
    this.entries = const [],
    this.stats,
    this.isLoading = false,
    this.error,
    this.currentPage = 1,
    this.hasMore = true,
  });

  LogState copyWith({
    List<LogEntry>? entries,
    LogStats? stats,
    bool? isLoading,
    String? error,
    int? currentPage,
    bool? hasMore,
  }) {
    return LogState(
      entries: entries ?? this.entries,
      stats: stats ?? this.stats,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

/// Log state notifier
class LogNotifier extends StateNotifier<LogState> {
  final LogService _logService = LogService();
  
  LogNotifier() : super(const LogState());

  /// Fetch logs (paginated)
  Future<void> fetchLogs({bool refresh = false}) async {
    if (state.isLoading) return;
    
    final page = refresh ? 1 : state.currentPage;
    state = state.copyWith(isLoading: true, error: null);

    try {
      final logs = await _logService.getLogs(page: page);
      
      state = state.copyWith(
        entries: refresh ? logs : [...state.entries, ...logs],
        isLoading: false,
        currentPage: page + 1,
        hasMore: logs.length >= 20,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Fetch stats
  Future<void> fetchStats() async {
    try {
      final stats = await _logService.getStats();
      state = state.copyWith(stats: stats);
    } catch (e) {
      print('Error fetching stats: $e');
    }
  }

  /// Add a new log entry
  Future<void> addLog(LogEntry entry) async {
    state = state.copyWith(isLoading: true);
    try {
      final newEntry = await _logService.createLog(entry.toJson());
      if (newEntry != null) {
        state = state.copyWith(
          entries: [newEntry, ...state.entries],
          isLoading: false,
        );
      } else {
        state = state.copyWith(isLoading: false);
      }
      fetchStats();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Update an existing log entry
  Future<void> updateLog(String id, LogEntry entry) async {
    state = state.copyWith(isLoading: true);
    try {
      final updated = await _logService.updateLog(id, entry.toJson());
      if (updated != null) {
        final entries = state.entries.map((e) => e.id == id ? updated : e).toList();
        state = state.copyWith(
          entries: entries,
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

  /// Delete a log entry
  Future<void> deleteLog(String id) async {
    try {
      await _logService.deleteLog(id);
      state = state.copyWith(
        entries: state.entries.where((e) => e.id != id).toList(),
      );
      fetchStats();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}

/// Log state provider
final logStateProvider = StateNotifierProvider<LogNotifier, LogState>((ref) {
  return LogNotifier();
});
