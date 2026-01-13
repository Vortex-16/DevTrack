import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/showcase_service.dart';

// State
class ShowcaseState {
  final bool isLoading;
  final List<dynamic> showcaseProjects;
  final List<dynamic> myShowcase;
  final List<dynamic> trending;
  final String? error;

  ShowcaseState({
    this.isLoading = false,
    this.showcaseProjects = const [],
    this.myShowcase = const [],
    this.trending = const [],
    this.error,
  });

  ShowcaseState copyWith({
    bool? isLoading,
    List<dynamic>? showcaseProjects,
    List<dynamic>? myShowcase,
    List<dynamic>? trending,
    String? error,
  }) {
    return ShowcaseState(
      isLoading: isLoading ?? this.isLoading,
      showcaseProjects: showcaseProjects ?? this.showcaseProjects,
      myShowcase: myShowcase ?? this.myShowcase,
      trending: trending ?? this.trending,
      error: error,
    );
  }
}

// Notifier
class ShowcaseNotifier extends StateNotifier<ShowcaseState> {
  final ShowcaseService _service = ShowcaseService();

  ShowcaseNotifier() : super(ShowcaseState());

  Future<void> fetchAll({bool refresh = false}) async {
    if (state.isLoading && !refresh) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final projects = await _service.getAll();
      state = state.copyWith(
        isLoading: false,
        showcaseProjects: projects,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> fetchMine() async {
    try {
      final  projects = await _service.getMine();
      state = state.copyWith(myShowcase: projects);
    } catch (e) {
      // Handle error quietly or populate specific error state
    }
  }

  Future<void> fetchTrending() async {
    try {
      final projects = await _service.getTrending();
      state = state.copyWith(trending: projects);
    } catch (e) {
      // Handle error
    }
  }

  Future<void> toggleStar(String id) async {
    try {
      await _service.toggleStar(id);
      // Optimistically update or refetch
      await fetchAll(refresh: true);
      await fetchTrending();
    } catch (e) {
      state = state.copyWith(error: 'Failed to star project');
    }
  }
}

// Provider
final showcaseProvider =
    StateNotifierProvider<ShowcaseNotifier, ShowcaseState>((ref) {
  return ShowcaseNotifier();
});
