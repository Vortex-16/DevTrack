import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/ideas_service.dart';
import '../services/storage_service.dart';

// State
class IdeasState {
  final bool isLoading;
  final bool isGenerating;
  final List<dynamic> savedIdeas;
  final dynamic generatedIdea; // Single idea or list depending on API
  final String? error;

  IdeasState({
    this.isLoading = false,
    this.isGenerating = false,
    this.savedIdeas = const [],
    this.generatedIdea,
    this.error,
  });

  IdeasState copyWith({
    bool? isLoading,
    bool? isGenerating,
    List<dynamic>? savedIdeas,
    dynamic generatedIdea,
    String? error,
  }) {
    return IdeasState(
      isLoading: isLoading ?? this.isLoading,
      isGenerating: isGenerating ?? this.isGenerating,
      savedIdeas: savedIdeas ?? this.savedIdeas,
      generatedIdea: generatedIdea ?? this.generatedIdea,
      error: error,
    );
  }
}

// Notifier
class IdeasNotifier extends StateNotifier<IdeasState> {
  final IdeasService _service = IdeasService();
  final StorageService _storage = StorageService();

  IdeasNotifier() : super(IdeasState()) {
    loadFromCache();
  }

  Future<void> loadFromCache() async {
    final cached = _storage.getCachedSavedIdeas();
    if (cached != null) {
      state = state.copyWith(savedIdeas: cached);
    }
  }

  Future<void> fetchSavedIdeas() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final ideas = await _service.getSavedIdeas();
      await _storage.cacheSavedIdeas(ideas.map((e) => Map<String, dynamic>.from(e)).toList());
      state = state.copyWith(isLoading: false, savedIdeas: ideas);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> generateIdeas(Map<String, dynamic> options) async {
    state = state.copyWith(isGenerating: true, error: null);
    try {
      final result = await _service.generateIdeas(options);
      state = state.copyWith(isGenerating: false, generatedIdea: result);
    } catch (e) {
      state = state.copyWith(isGenerating: false, error: e.toString());
    }
  }

  Future<void> saveIdea(Map<String, dynamic> ideaData) async {
    try {
      // Optimistic update
      final newIdeas = [...state.savedIdeas, ideaData];
      state = state.copyWith(savedIdeas: newIdeas);
      
      await _service.saveIdea(ideaData);
      // Refresh to get server ID if needed, or rely on successful post
      fetchSavedIdeas();
    } catch (e) {
      state = state.copyWith(error: 'Failed to save idea');
      // Revert if needed
      fetchSavedIdeas();
    }
  }

  Future<void> removeIdea(String id) async {
    try {
       // Optimistic remove
      final newIdeas = state.savedIdeas.where((i) => i['_id'] != id && i['id'] != id).toList();
      state = state.copyWith(savedIdeas: newIdeas);

      await _service.removeIdea(id);
    } catch (e) {
      state = state.copyWith(error: 'Failed to delete idea');
       fetchSavedIdeas();
    }
  }
}

// Provider
final ideasProvider = StateNotifierProvider<IdeasNotifier, IdeasState>((ref) {
  return IdeasNotifier();
});
