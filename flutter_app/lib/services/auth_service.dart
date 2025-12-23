import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/api_config.dart';
import '../models/user.dart';
import 'api_service.dart';

/// Service for authentication using Clerk (via web redirect)
/// Since your backend uses Clerk, we need to handle auth via the web app
class AuthService {
  final ApiService _api = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  /// The web app URL for sign-in (uses Clerk modal internally)
  /// Opens the deployed DevTrack web app which has Clerk integrated
  static const String webAppSignInUrl = 'https://devtrack-pwkj.onrender.com';

  /// Alternative: Direct link if web app has a login route
  static const String webAppLoginUrl = 'https://devtrack-pwkj.onrender.com';

  /// Redirect URL after Clerk auth (configure in Clerk dashboard)
  static const String redirectUrl = 'https://devtrack-pwkj.onrender.com';

  /// Login with GitHub via Clerk
  /// This opens the web app which handles OAuth via Clerk
  Future<bool> loginWithGitHub() async {
    try {
      // Open the deployed web app - user signs in via Clerk modal there
      // After login, they copy the session token and paste it in the app
      final signInUrl = Uri.parse(webAppSignInUrl);

      if (await canLaunchUrl(signInUrl)) {
        await launchUrl(signInUrl, mode: LaunchMode.externalApplication);
        return true;
      } else {
        print('Could not launch web app URL');
        return false;
      }
    } catch (e) {
      print('GitHub login error: $e');
      rethrow;
    }
  }

  /// For development/testing: Manual token entry
  /// The user can sign in via web and paste the session token here
  Future<User?> loginWithToken(String sessionToken) async {
    try {
      // Store the token
      await _api.setAuthToken(sessionToken);

      // Verify by getting user info
      final user = await getCurrentUser();
      if (user == null) {
        await _api.clearAuthToken();
        return null;
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
