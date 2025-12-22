/// API Configuration for DevTrack Flutter App
/// Contains base URLs, endpoints, and OAuth configuration

class ApiConfig {
  // Base URLs
  static const String apiUrl = 'https://devtrack-api.onrender.com/api';
  static const String prodApiUrl = 'https://devtrack-api.onrender.com/api';

  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);

  // GitHub OAuth Configuration
  static const String githubClientId =
      'Ov23liNjaTQGQWa3SCMJ'; // From Clerk integration
  static const String githubRedirectUri = 'devtrack://oauth/callback';

  // Clerk Configuration (for web auth reference)
  static const String clerkPublishableKey =
      'pk_test_aGlwLXNlYWwtODQuY2xlcmsuYWNjb3VudHMuZGV2JA';

  /// Get the appropriate API URL based on environment
  static String get baseUrl => apiUrl;
}

/// Backend API Endpoints - Matching Node.js server routes
class ApiEndpoints {
  // Auth
  static const String authSync = '/auth/sync';
  static const String authMe = '/auth/me';
  static const String preferences = '/auth/preferences';

  // Learning Logs
  static const String logs = '/logs';
  static String logById(String id) => '/logs/$id';
  static const String logsStats = '/logs/stats';

  // Projects
  static const String projects = '/projects';
  static String projectById(String id) => '/projects/$id';

  // Tasks
  static const String tasks = '/tasks';
  static String taskById(String id) => '/tasks/$id';

  // GitHub
  static const String githubProfile = '/github/profile';
  static const String githubRepos = '/github/repos';
  static const String githubLanguages = '/github/languages';
  static const String githubActivity = '/github/activity';
  static const String githubCommits = '/github/commits';
  static String githubRepo(String owner, String repo) =>
      '/github/repos/$owner/$repo';

  // AI/Chat
  static const String groqChat = '/groq/chat';
  static const String geminiChat = '/gemini/chat';
  static const String analyzeProject = '/gemini/analyze';

  // Notifications
  static const String notifications = '/notifications';
  static const String notificationsToken = '/notifications/token';
  static const String notificationsTest = '/notifications/test';
}
