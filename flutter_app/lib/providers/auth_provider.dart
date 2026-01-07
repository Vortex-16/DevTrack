import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/notification_service.dart';

/// Authentication state model
class AuthState {
  final bool isAuthenticated;
  final bool isLoading;
  final User? user;
  final bool hasCompletedOnboarding;
  final String? error;

  const AuthState({
    this.isAuthenticated = false,
    this.isLoading = false,
    this.user,
    this.hasCompletedOnboarding = false,
    this.error,
  });

  AuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    User? user,
    bool? hasCompletedOnboarding,
    String? error,
  }) {
    return AuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      hasCompletedOnboarding:
          hasCompletedOnboarding ?? this.hasCompletedOnboarding,
      error: error,
    );
  }

  factory AuthState.initial() => const AuthState();

  factory AuthState.loading() => const AuthState(isLoading: true);

  factory AuthState.authenticated(User user,
      {bool hasCompletedOnboarding = false}) {
    return AuthState(
      isAuthenticated: true,
      isLoading: false,
      user: user,
      hasCompletedOnboarding: hasCompletedOnboarding,
    );
  }

  factory AuthState.error(String message) {
    return AuthState(
      isAuthenticated: false,
      isLoading: false,
      error: message,
    );
  }
}

/// Auth state notifier with AuthService integration
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService = AuthService();

  AuthNotifier() : super(AuthState.initial());

  /// Initialize auth state from storage
  Future<void> initialize() async {
    state = AuthState.loading();
    try {
      // Check if user is logged in
      final isLoggedIn = await _authService.isLoggedIn();
      if (!isLoggedIn) {
        state = AuthState.initial();
        return;
      }

      // Get current user
      final user = await _authService.getCurrentUser();
      if (user == null) {
        state = AuthState.initial();
        return;
      }

      // Check onboarding status
      final hasCompletedOnboarding = await _authService.isOnboardingCompleted();

      state = AuthState.authenticated(
        user,
        hasCompletedOnboarding: hasCompletedOnboarding,
      );
    } catch (e) {
      state = AuthState.error('Failed to initialize auth: $e');
    }
  }

  /// Check auth state (called after deep link auth or app resume)
  Future<void> checkAuth() async {
    try {
      // Check if user is logged in
      final isLoggedIn = await _authService.isLoggedIn();
      if (!isLoggedIn) {
        state = AuthState.initial();
        return;
      }

      // Get current user
      final user = await _authService.getCurrentUser();
      if (user == null) {
        state = AuthState.initial();
        return;
      }

      // Check onboarding status
      final hasCompletedOnboarding = await _authService.isOnboardingCompleted();

      state = AuthState.authenticated(
        user,
        hasCompletedOnboarding: hasCompletedOnboarding,
      );
      
      print('✅ Auth check successful: ${user.name}');
    } catch (e) {
      print('❌ Auth check failed: $e');
      state = AuthState.error('Auth check failed: $e');
    }
  }

  /// Login with GitHub via Clerk (opens browser)
  Future<bool> loginWithGitHub() async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final success = await _authService.loginWithGitHub();
      // The browser will open - user needs to complete sign-in there
      // Then use loginWithToken to complete the flow
      state = state.copyWith(
        isLoading: false,
        error: success ? null : 'Could not open sign-in page',
      );
      return success;
    } catch (e) {
      state = AuthState.error(e.toString());
      return false;
    }
  }

  /// Login with session token (from Clerk cookie)
  Future<void> loginWithToken(String token) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final user = await _authService.loginWithToken(token);

      if (user == null) {
        state = AuthState.error('Invalid or expired token');
        return;
      }

      final hasCompletedOnboarding = await _authService.isOnboardingCompleted();

      state = AuthState.authenticated(
        user,
        hasCompletedOnboarding: hasCompletedOnboarding,
      );

      // Register FCM token after successful login
      try {
        await NotificationService().registerToken();
        print('✅ FCM token registered after login');
      } catch (e) {
        print('⚠️ Failed to register FCM token: $e');
      }
    } catch (e) {
      state = AuthState.error('Token login failed: $e');
    }
  }

  /// Logout
  Future<void> logout() async {
    state = state.copyWith(isLoading: true);
    try {
      await _authService.logout();
      state = AuthState.initial();
    } catch (e) {
      state = AuthState.error('Failed to logout: $e');
    }
  }

  /// Mark onboarding as completed
  Future<void> completeOnboarding({Map<String, dynamic>? preferences}) async {
    try {
      await _authService.setOnboardingCompleted(true);
      if (preferences != null) {
        await _authService.savePreferences(preferences);
      }
      state = state.copyWith(hasCompletedOnboarding: true);
    } catch (e) {
      print('Error completing onboarding: $e');
    }
  }

  /// Update user data
  void updateUser(User user) {
    state = state.copyWith(user: user);
  }
}

/// Auth state provider
final authStateProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier();
});
