import '../config/api_config.dart';
import 'api_service.dart';

class BookmarkService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getBookmarks() async {
    try {
      final response = await _api.get(ApiEndpoints.bookmarks);
      if (response.data['success'] == true) {
        return response.data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Bookmarks fetch error: $e');
      rethrow;
    }
  }

  Future<void> addBookmark(Map<String, dynamic> repoData) async {
    await _api.post(ApiEndpoints.bookmarks, data: repoData);
  }

  Future<void> removeBookmark(String repoId) async {
    await _api.delete(ApiEndpoints.bookmarkById(repoId));
  }

  Future<Map<String, bool>> checkStatus(List<String> repoIds) async {
    try {
      final response = await _api.post(
        ApiEndpoints.checkBookmarks,
        data: {'repoIds': repoIds},
      );
      if (response.data['success'] == true) {
        return Map<String, bool>.from(response.data['data']);
      }
      return {};
    } catch (e) {
      print('Check bookmarks status error: $e');
      return {};
    }
  }
}
