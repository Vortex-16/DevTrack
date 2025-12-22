import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../config/router.dart';
import '../../providers/auth_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final TextEditingController _tokenController = TextEditingController();
  bool _showTokenInput = false;

  @override
  void dispose() {
    _tokenController.dispose();
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
                    Text(
                      'DevTrack',
                      style:
                          Theme.of(context).textTheme.displayMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
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
                    _FeatureItem(
                      icon: Icons.trending_up,
                      text: 'Track learning progress',
                    ).animate().fadeIn(delay: 800.ms).slideX(begin: -0.2),
                    const SizedBox(height: 12),
                    _FeatureItem(
                      icon: Icons.code,
                      text: 'Manage projects with AI',
                    ).animate().fadeIn(delay: 900.ms).slideX(begin: -0.2),
                    const SizedBox(height: 12),
                    _FeatureItem(
                      icon: Icons.local_fire_department,
                      text: 'Build consistency streaks',
                    ).animate().fadeIn(delay: 1000.ms).slideX(begin: -0.2),
                  ],
                ),

                const SizedBox(height: 48),

                // Login Button - Opens web app in browser and shows token input
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: authState.isLoading
                        ? null
                        : () {
                            ref
                                .read(authStateProvider.notifier)
                                .loginWithGitHub();
                            // Show token input after opening web app
                            setState(() => _showTokenInput = true);
                          },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                    ),
                    icon: authState.isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.code, size: 24),
                    label: const Text(
                      'Sign in with GitHub',
                      style:
                          TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                ).animate().fadeIn(delay: 1200.ms).slideY(begin: 0.2),

                const SizedBox(height: 16),

                // Token input toggle
                if (!_showTokenInput)
                  TextButton(
                    onPressed: () => setState(() => _showTokenInput = true),
                    child: Text(
                      'Already signed in? Enter token',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.textMuted,
                          ),
                    ),
                  ),

                if (_showTokenInput) ...[
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '🔐 Complete Sign-In',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '1. Sign in on the web app (just opened)\n'
                          '2. Go to Dashboard, scroll down\n'
                          '3. Find "📱 Mobile App Login" card\n'
                          '4. Tap "Get Session Token" → "Copy"\n'
                          '5. Paste here and tap Login',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.textMuted,
                                  ),
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          controller: _tokenController,
                          decoration: const InputDecoration(
                            hintText: 'Paste session token here...',
                            border: OutlineInputBorder(),
                          ),
                          maxLines: 2,
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: authState.isLoading
                                ? null
                                : () {
                                    if (_tokenController.text.isNotEmpty) {
                                      ref
                                          .read(authStateProvider.notifier)
                                          .loginWithToken(
                                              _tokenController.text.trim());
                                    }
                                  },
                            child: const Text('Login with Token'),
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(),
                ],

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
