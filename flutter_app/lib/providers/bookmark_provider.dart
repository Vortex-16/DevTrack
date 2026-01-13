import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/bookmark_service.dart';
import '../services/storage_service.dart';

// State
class BookmarkState {
  final bool isLoading;
  final List<dynamic> bookmarks;
  final String? error;

  BookmarkState({
    this.isLoading = false,
    this.bookmarks = const [],
    this.error,
  });

  BookmarkState copyWith({
    bool? isLoading,
    List<dynamic>? bookmarks,
    String? error,
  }) {
    return BookmarkState(
      isLoading: isLoading ?? this.isLoading,
      bookmarks: bookmarks ?? this.bookmarks,
      error: error,
    );
  }
}

// Notifier
class BookmarkNotifier extends StateNotifier<BookmarkState> {
  final BookmarkService _service = BookmarkService();
  final StorageService _storage = StorageService();

  BookmarkNotifier() : super(BookmarkState()) {
    loadFromCache();
  }

  Future<void> loadFromCache() async {
    final cached = _storage.getCachedBookmarks();
    if (cached != null) {
      state = state.copyWith(bookmarks: cached);
    }
  }

  Future<void> fetchBookmarks() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final bookmarks = await _service.getBookmarks();
      await _storage.cacheBookmarks(bookmarks.map((e) => Map<String, dynamic>.from(e)).toList());
      state = state.copyWith(isLoading: false, bookmarks: bookmarks);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> addBookmark(Map<String, dynamic> repoData) async {
    try {
      // Optimistic
      final newBookmarks = [...state.bookmarks, repoData];
      state = state.copyWith(bookmarks: newBookmarks);

      await _service.addBookmark(repoData);
      fetchBookmarks();
    } catch (e) {
      state = state.copyWith(error: 'Failed to add bookmark');
      fetchBookmarks();
    }
  }

  Future<void> removeBookmark(String repoId) async {
    try {
      // Optimistic
      final newBookmarks = state.bookmarks.where((b) => b['repoId'] != repoId && b['id'] != repoId).toList();
      state = state.copyWith(bookmarks: newBookmarks);

      await _service.removeBookmark(repoId);
    } catch (e) {
      state = state.copyWith(error: 'Failed to remove bookmark');
      fetchBookmarks();
    }
  }
  
  bool isBookmarked(String repoId) {
    return state.bookmarks.any((b) => b['repoId'] == repoId || b['id'] == repoId || b['repositoryId'] == repoId);
  }
}

// Provider
final bookmarkProvider =
    StateNotifierProvider<BookmarkNotifier, BookmarkState>((ref) {
  return BookmarkNotifier();
});
