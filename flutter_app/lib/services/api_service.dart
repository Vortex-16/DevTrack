import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

/// Main API service for communicating with DevTrack backend
class ApiService {
  static ApiService? _instance;
  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService._internal() {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.apiUrl,
      connectTimeout: ApiConfig.connectionTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));

    // Add interceptors for auth and logging
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Add auth token to requests
        final token = await _safeRead('auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        print('→ ${options.method} ${options.path}');
        return handler.next(options);
      },
      onResponse: (response, handler) {
        print('← ${response.statusCode} ${response.requestOptions.path}');
        return handler.next(response);
      },
      onError: (error, handler) {
        print('✖ ${error.response?.statusCode} ${error.message}');
        return handler.next(error);
      },
    ));
  }

  factory ApiService() {
    _instance ??= ApiService._internal();
    return _instance!;
  }

  /// Helper to safely read from secure storage and handle PlatformExceptions
  Future<String?> _safeRead(String key) async {
    try {
      return await _storage.read(
        key: key,
        aOptions: const AndroidOptions(encryptedSharedPreferences: true),
      );
    } catch (e) {
      print('⚠️ Secure storage read error for $key: $e');
      // If we hit a decryption error, the storage is likely corrupted
      if (e.toString().contains('BadPaddingException') ||
          e.toString().contains('BAD_DECRYPT')) {
        print('🧹 Decryption failed, clearing storage...');
        await _storage.deleteAll(
          aOptions: const AndroidOptions(encryptedSharedPreferences: true),
        );
      }
      return null;
    }
  }

  /// Store auth token securely
  Future<void> setAuthToken(String token) async {
    try {
      await _storage.write(
        key: 'auth_token',
        value: token,
        aOptions: const AndroidOptions(encryptedSharedPreferences: true),
      );
    } catch (e) {
      print('Error writing to secure storage: $e');
    }
  }

  /// Get stored auth token
  Future<String?> getAuthToken() async {
    return await _safeRead('auth_token');
  }

  /// Clear auth token on logout
  Future<void> clearAuthToken() async {
    try {
      await _storage.delete(
        key: 'auth_token',
        aOptions: const AndroidOptions(encryptedSharedPreferences: true),
      );
    } catch (e) {
      print('Error deleting from secure storage: $e');
    }
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final token = await _safeRead('auth_token');
    return token != null && token.isNotEmpty;
  }

  // ==================== HTTP METHODS ====================

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) async {
    return _dio.get<T>(path, queryParameters: queryParameters);
  }

  Future<Response<T>> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return _dio.post<T>(path, data: data, queryParameters: queryParameters);
  }

  Future<Response<T>> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return _dio.put<T>(path, data: data, queryParameters: queryParameters);
  }

  Future<Response<T>> delete<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
  }) async {
    return _dio.delete<T>(path, data: data, queryParameters: queryParameters);
  }
}
