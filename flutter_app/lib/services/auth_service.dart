import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/api_config.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'sync_service.dart';

/// Service for authentication using Clerk (via web redirect)
/// Since your backend uses Clerk, we need to handle auth via the web app
/// Now supports deep linking for seamless auth flow
class AuthService {
  final ApiService _api = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  /// The web app URL for sign-in (uses Clerk modal internally)
  static const String webAppSignInUrl = 'https://devtrack-pwkj.onrender.com';

  /// Mobile auth URL - handles Clerk login and redirects back to app
  static const String mobileAuthUrl = 'https://devtrack-pwkj.onrender.com/mobile-auth';

  /// Login with GitHub via Clerk
  /// Opens the web app's mobile auth page which:
  /// 1. Triggers Clerk sign-in modal
  /// 2. After success, redirects back to app via deep link with session token
  Future<bool> loginWithGitHub() async {
    try {
      final signInUrl = Uri.parse(mobileAuthUrl);
      
      print('🌐 Attempting to launch: $signInUrl');
      
      // Try to launch with external application (browser)
      final success = await launchUrl(
        signInUrl, 
        mode: LaunchMode.externalApplication,
      );
      
      if (!success) {
        print('⚠️ launchUrl returned false, trying fallback mode...');
        // Fallback to platform default
        return await launchUrl(signInUrl);
      }
      
      return success;
    } catch (e) {
      print('❌ GitHub login error: $e');
      // Final attempt with platform default
      try {
        return await launchUrl(Uri.parse(mobileAuthUrl));
      } catch (_) {
        return false;
      }
    }
  }

  /// For development/testing: Manual token entry
  /// The user can sign in via web and paste the session token here
  /// Token will be valid for 7 days
  Future<User?> loginWithToken(String sessionToken) async {
    try {
      // Store the token (also sets 7-day expiry automatically)
      await _api.setAuthToken(sessionToken);

      // Verify by getting user info
      final user = await getCurrentUser();
      if (user == null) {
        await _api.clearAuthToken();
        return null;
      }

      // Sync user data after successful login
      print('🔄 Triggering full sync after login...');
      final syncService = SyncService();
      await syncService.initialize();
      final syncResult = await syncService.fullSync();
      print('✅ Post-login sync: ${syncResult.message}');

      // Log session info
      final remainingTime = await _api.getRemainingSessionTime();
      if (remainingTime != null) {
        print('⏰ Session will expire in: ${remainingTime.inDays} days');
      }

      return user;
    } catch (e) {
      await _api.clearAuthToken();
      print('Token login error: $e');
      return null;
    }
  }

  /// Get current user from stored session
  Future<User?> getCurrentUser() async {
    try {
      final isAuth = await _api.isAuthenticated();
      if (!isAuth) return null;

      final response = await _api.get(ApiEndpoints.authMe);
      final data = response.data;

      if (data['success'] == true && data['user'] != null) {
        return User.fromJson(data['user']);
      }
      return null;
    } catch (e) {
      print('Error getting current user: $e');
      // Token might be expired, clear it
      await _api.clearAuthToken();
      return null;
    }
  }

  /// Logout and clear stored credentials
  Future<void> logout() async {
    await _api.clearAuthToken();
    await _storage.deleteAll();
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    return await _api.isAuthenticated();
  }

  /// Store onboarding completion status
  Future<void> setOnboardingCompleted(bool completed) async {
    await _storage.write(
      key: 'onboarding_completed',
      value: completed.toString(),
      aOptions: const AndroidOptions(encryptedSharedPreferences: true),
    );
  }

  /// Check if onboarding is completed
  Future<bool> isOnboardingCompleted() async {
    try {
      final value = await _storage.read(
        key: 'onboarding_completed',
        aOptions: const AndroidOptions(encryptedSharedPreferences: true),
      );
      return value == 'true';
    } catch (e) {
      print('Error reading onboarding status: $e');
      return false;
    }
  }

  /// Save user preferences
  Future<void> savePreferences(Map<String, dynamic> preferences) async {
    try {
      await _api.put(
        ApiEndpoints.preferences,
        data: preferences,
      );
    } catch (e) {
      print('Error saving preferences: $e');
      rethrow;
    }
  }

  /// Get user preferences
  Future<Map<String, dynamic>> getPreferences() async {
    try {
      final response = await _api.get(ApiEndpoints.preferences);
      return Map<String, dynamic>.from(response.data);
    } catch (e) {
      print('Error getting preferences: $e');
      return {};
    }
  }
}
