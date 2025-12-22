import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/project.dart';
import '../services/project_service.dart';

/// Project state
class ProjectState {
  final List<Project> projects;
  final bool isLoading;
  final String? error;
  final Project? selectedProject;

  const ProjectState({
    this.projects = const [],
    this.isLoading = false,
    this.error,
    this.selectedProject,
  });

  ProjectState copyWith({
    List<Project>? projects,
    bool? isLoading,
    String? error,
    Project? selectedProject,
  }) {
    return ProjectState(
      projects: projects ?? this.projects,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      selectedProject: selectedProject ?? this.selectedProject,
    );
  }
}

/// Project state notifier
class ProjectNotifier extends StateNotifier<ProjectState> {
  final ProjectService _projectService = ProjectService();
  
  ProjectNotifier() : super(const ProjectState());

  /// Fetch all projects
  Future<void> fetchProjects() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final projects = await _projectService.getProjects();
      state = state.copyWith(
        projects: projects,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  /// Add a new project
  Future<void> addProject(Project project) async {
    state = state.copyWith(isLoading: true);
    try {
      final newProject = await _projectService.createProject(project.toJson());
      if (newProject != null) {
        state = state.copyWith(
          projects: [...state.projects, newProject],
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

  /// Update a project
  Future<void> updateProject(String id, Project project) async {
    state = state.copyWith(isLoading: true);
    try {
      final updated = await _projectService.updateProject(id, project.toJson());
      if (updated != null) {
        final projects = state.projects.map((p) => p.id == id ? updated : p).toList();
        state = state.copyWith(
          projects: projects,
          isLoading: false,
          selectedProject: state.selectedProject?.id == id ? updated : state.selectedProject,
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

  /// Delete a project
  Future<void> deleteProject(String id) async {
    try {
      await _projectService.deleteProject(id);
      state = state.copyWith(
        projects: state.projects.where((p) => p.id != id).toList(),
        selectedProject: state.selectedProject?.id == id ? null : state.selectedProject,
      );
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  /// Analyze project with AI
  Future<void> analyzeProject(String id) async {
    state = state.copyWith(isLoading: true);
    try {
      final analysis = await _projectService.getAIAnalysis(id);
      if (analysis != null) {
        final projects = state.projects.map((p) {
          if (p.id == id) {
            return p.copyWith(aiAnalysis: ProjectAnalysis.fromJson(analysis));
          }
          return p;
        }).toList();
        state = state.copyWith(
          projects: projects,
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

  /// Select a project
  void selectProject(Project? project) {
    state = state.copyWith(selectedProject: project);
  }
}

/// Project state provider
final projectStateProvider = StateNotifierProvider<ProjectNotifier, ProjectState>((ref) {
  return ProjectNotifier();
});
