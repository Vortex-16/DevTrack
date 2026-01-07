import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:async';
import 'package:flutter/services.dart';
import '../../config/theme.dart';
import '../../config/router.dart';
import '../../providers/auth_provider.dart';
import '../../services/deep_link_service.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final TextEditingController _tokenController = TextEditingController();
  bool _showTokenInput = false;
  StreamSubscription? _deepLinkSubscription;

  @override
  void initState() {
    super.initState();
    _listenToDeepLinkAuth();
  }

  void _listenToDeepLinkAuth() {
    final deepLinkService = DeepLinkService();
    _deepLinkSubscription = deepLinkService.authStateStream.listen((state) {
      if (state == DeepLinkAuthState.success) {
        // Deep link auth successful, check auth state
        ref.read(authStateProvider.notifier).checkAuth();
      } else if (state == DeepLinkAuthState.failed) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Authentication failed. Please try again.'),
            backgroundColor: AppColors.error,
          ),
        );
      } else if (state == DeepLinkAuthState.processing) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Processing login...'),
            duration: Duration(seconds: 1),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _tokenController.dispose();
    _deepLinkSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);

    // Listen for auth state changes and navigate
    ref.listen<AuthState>(authStateProvider, (previous, next) {
      if (next.isAuthenticated) {
        if (next.hasCompletedOnboarding) {
          context.go(AppRoutes.dashboard);
        } else {
          context.go(AppRoutes.onboarding);
        }
      }
      if (next.error != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error!),
            backgroundColor: AppColors.error,
          ),
        );
      }
    });

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              AppColors.backgroundSecondary,
              AppColors.background,
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const SizedBox(height: 60),

                // Logo and Title
                Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        gradient: AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withOpacity(0.3),
                            blurRadius: 30,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.asset(
                          'assets/images/DevTrack.png',
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ).animate().scale(delay: 200.ms),
                    const SizedBox(height: 24),
                    Wrap(
                      alignment: WrapAlignment.center,
                      children: [
                        Text(
                          'Dev',
                          style: Theme.of(context)
                              .textTheme
                              .displayMedium
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        Text(
                          'Track',
                          style: Theme.of(context)
                              .textTheme
                              .displayMedium
                              ?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ],
                    ).animate().fadeIn(delay: 400.ms),
                    const SizedBox(height: 8),
                    Text(
                      'Track your developer journey.\nProve your consistency.',
                      style: Theme.of(context).textTheme.bodyLarge,
                      textAlign: TextAlign.center,
                    ).animate().fadeIn(delay: 600.ms),
                  ],
                ),

                const SizedBox(height: 48),

                // Features
                Column(
                  children: [
                    const _FeatureItem(
                      icon: Icons.trending_up,
                      text: 'Track learning progress',
                    ).animate().fadeIn(delay: 800.ms).slideX(begin: -0.2),
                    const SizedBox(height: 12),
                    const _FeatureItem(
                      icon: Icons.code,
                      text: 'Manage projects with AI',
                    ).animate().fadeIn(delay: 900.ms).slideX(begin: -0.2),
                    const SizedBox(height: 12),
                    const _FeatureItem(
                      icon: Icons.local_fire_department,
                      text: 'Build consistency streaks',
                    ).animate().fadeIn(delay: 1000.ms).slideX(begin: -0.2),
                  ],
                ),

                const SizedBox(height: 48),

                // Primary Action: Open Dashboard
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () async {
                      final success = await ref.read(authStateProvider.notifier).loginWithGitHub();
                      if (!success && mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Could not open browser. Please visit: https://devtrack-pwkj.onrender.com'),
                            backgroundColor: AppColors.error,
                          ),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    icon: const Icon(Icons.open_in_new, size: 20),
                    label: const Text(
                      '1. Open Web Dashboard',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ),
                ).animate().fadeIn(delay: 1200.ms),

                const SizedBox(height: 32),

                // Token Input Section (Primary)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '2. Enter Session Token',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'After signing in on the web:\n'
                        '• Find "📱 Mobile App Login" card\n'
                        '• Tap "Get Session Token" and Copy it\n'
                        '• Paste it here to link your account',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textMuted,
                              height: 1.5,
                            ),
                      ),
                      const SizedBox(height: 20),
                      TextField(
                        controller: _tokenController,
                        style: const TextStyle(fontSize: 14),
                        decoration: InputDecoration(
                          hintText: 'Paste token here...',
                          filled: true,
                          fillColor: AppColors.background,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 14,
                          ),
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.paste, size: 20),
                            onPressed: () async {
                              final data = await Clipboard.getData(Clipboard.kTextPlain);
                              if (data?.text != null) {
                                setState(() {
                                  _tokenController.text = data!.text!;
                                });
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Token pasted from clipboard')),
                                );
                              }
                            },
                          ),
                        ),
                        maxLines: 1,
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: authState.isLoading
                              ? null
                              : () {
                                  if (_tokenController.text.isNotEmpty) {
                                    ref
                                        .read(authStateProvider.notifier)
                                        .loginWithToken(_tokenController.text.trim());
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: authState.isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const Text('Connect Application'),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 1400.ms),

                const SizedBox(height: 16),
                Text(
                  'By continuing, you agree to our Terms of Service',
                  style: Theme.of(context).textTheme.bodySmall,
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 1400.ms),

                const SizedBox(height: 48),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FeatureItem extends StatelessWidget {
  final IconData icon;
  final String text;

  const _FeatureItem({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 12),
        Text(text, style: Theme.of(context).textTheme.bodyLarge),
      ],
    );
  }
}
