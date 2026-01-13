import '../config/api_config.dart';
import 'api_service.dart';

class IdeasService {
  final ApiService _api = ApiService();

  Future<List<dynamic>> getSavedIdeas() async {
    try {
      final response = await _api.get(ApiEndpoints.savedIdeas);
      if (response.data['success'] == true) {
        return response.data['data'] ?? [];
      }
      return [];
    } catch (e) {
      print('Saved ideas fetch error: $e');
      rethrow;
    }
  }

  Future<dynamic> generateIdeas(Map<String, dynamic> options) async {
    try {
      final response = await _api.post(
        ApiEndpoints.generateIdeas,
        data: options,
      );
      if (response.data['success'] == true) {
        return response.data['data'];
      }
      throw Exception('Failed to generate ideas');
    } catch (e) {
      print('Generate ideas error: $e');
      rethrow;
    }
  }

  Future<void> saveIdea(Map<String, dynamic> ideaData) async {
    await _api.post(ApiEndpoints.savedIdeas, data: ideaData);
  }

  Future<void> removeIdea(String id) async {
    await _api.delete(ApiEndpoints.savedIdeaById(id));
  }

  Future<Map<String, bool>> checkStatus(List<String> titles) async {
    try {
      final response = await _api.post(
        ApiEndpoints.checkSavedIdeas,
        data: {'titles': titles},
      );
      if (response.data['success'] == true) {
        return Map<String, bool>.from(response.data['data']);
      }
      return {};
    } catch (e) {
      print('Check ideas status error: $e');
      return {};
    }
  }
}
