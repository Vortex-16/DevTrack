import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'api_service.dart';

class ShowcaseService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getAll({
    bool excludeOwn = false,
    String search = '',
    String technology = '',
  }) async {
    try {
      final response = await _api.get(
        ApiEndpoints.showcase,
        params: {
          'excludeOwn': excludeOwn,
          'search': search,
          'technology': technology,
        },
      );
      if (response.data['success'] == true) {
        return response.data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Showcase fetch error: $e');
      rethrow;
    }
  }

  Future<List<dynamic>> getMine() async {
    try {
      final response = await _api.get(ApiEndpoints.showcaseMine);
      if (response.data['success'] == true) {
        return response.data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('My Showcase fetch error: $e');
      rethrow;
    }
  }

  Future<List<dynamic>> getTrending() async {
    try {
      final response = await _api.get(ApiEndpoints.showcaseTrending);
      if (response.data['success'] == true) {
        return response.data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Trending Showcase fetch error: $e');
      rethrow;
    }
  }

  Future<bool> checkStatus(String projectId) async {
    try {
      final response = await _api.get(ApiEndpoints.showcaseCheck(projectId));
      return response.data['isShowcased'] ?? false;
    } catch (e) {
      return false;
    }
  }

  Future<void> create(Map<String, dynamic> data) async {
    await _api.post(ApiEndpoints.showcase, data: data);
  }

  Future<void> delete(String id) async {
    await _api.delete('${ApiEndpoints.showcase}/$id');
  }

  Future<void> toggleStar(String id) async {
    await _api.post(ApiEndpoints.showcaseStar(id));
  }

  Future<void> addComment(
      String id, String content, String authorName, String authorAvatar) async {
    await _api.post(
      ApiEndpoints.showcaseComments(id),
      data: {
        'content': content,
        'authorName': authorName,
        'authorAvatar': authorAvatar,
      },
    );
  }

  Future<void> deleteComment(String showcaseId, String commentId) async {
    await _api.delete(ApiEndpoints.showcaseCommentDelete(showcaseId, commentId));
  }
}
