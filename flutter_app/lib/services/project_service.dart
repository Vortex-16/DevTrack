import '../config/api_config.dart';
import '../models/project.dart';
import 'api_service.dart';

/// Service for project operations
class ProjectService {
  final ApiService _api = ApiService();

  /// Get all projects
  Future<List<Project>> getProjects() async {
    try {
      final response = await _api.get(ApiEndpoints.projects);
      final data = response.data;

      // Backend returns { success: true, data: { projects: [...], pagination: {...} } }
      List<dynamic> projectsData = [];
      if (data is Map) {
        if (data['data'] != null && data['data']['projects'] != null) {
          projectsData = data['data']['projects'];
        } else if (data['projects'] != null) {
          projectsData = data['projects'];
        } else if (data['data'] is List) {
          projectsData = data['data'];
        }
      } else if (data is List) {
        projectsData = data;
      }

      return projectsData.map((json) => Project.fromJson(json)).toList();
    } catch (e) {
      print('Error fetching projects: $e');
      return [];
    }
  }

  /// Get a single project
  Future<Project?> getProject(String id) async {
    try {
      final response = await _api.get('${ApiEndpoints.projects}/$id');
      final data = response.data;

      if (data is Map) {
        final project = data['data'] ?? data['project'] ?? data;
        return Project.fromJson(project);
      }
      return null;
    } catch (e) {
      print('Error fetching project: $e');
      return null;
    }
  }

  /// Create a new project
  Future<Project?> createProject(Map<String, dynamic> projectData) async {
    try {
      final response =
          await _api.post(ApiEndpoints.projects, data: projectData);
      final data = response.data;

      if (data is Map) {
        final project = data['data'] ?? data['project'] ?? data;
        return Project.fromJson(project);
      }
      return null;
    } catch (e) {
      print('Error creating project: $e');
      return null;
    }
  }

  /// Update a project
  Future<Project?> updateProject(
      String id, Map<String, dynamic> projectData) async {
    try {
      final response =
          await _api.put('${ApiEndpoints.projects}/$id', data: projectData);
      final data = response.data;

      if (data is Map) {
        final project = data['data'] ?? data['project'] ?? data;
        return Project.fromJson(project);
      }
      return null;
    } catch (e) {
      print('Error updating project: $e');
      return null;
    }
  }

  /// Delete a project
  Future<bool> deleteProject(String id) async {
    try {
      await _api.delete('${ApiEndpoints.projects}/$id');
      return true;
    } catch (e) {
      print('Error deleting project: $e');
      return false;
    }
  }

  /// Get AI analysis for a project
  Future<Map<String, dynamic>?> getAIAnalysis(String id) async {
    try {
      final response = await _api.get('${ApiEndpoints.projects}/$id/analyze');
      final data = response.data;

      if (data is Map) {
        return data['data'] ??
            data['analysis'] ??
            Map<String, dynamic>.from(data);
      }
      return null;
    } catch (e) {
      print('Error getting AI analysis: $e');
      return null;
    }
  }
}
