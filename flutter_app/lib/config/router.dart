import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../screens/splash/splash_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/learning/learning_screen.dart';
import '../screens/projects/projects_screen.dart';
import '../screens/chat/chat_screen.dart';
import '../screens/calendar/calendar_screen.dart';
import '../screens/settings/settings_screen.dart';
import '../screens/showcase/showcase_screen.dart';
import '../screens/ideas/ideas_screen.dart';
import '../screens/bookmarks/bookmarks_screen.dart';
import '../screens/dashboard/insights_screen.dart';
import '../widgets/app_drawer.dart';
import 'theme.dart';

/// Route names as constants
class AppRoutes {
  static const String splash = '/';
  static const String login = '/login';
  static const String onboarding = '/onboarding';
  static const String dashboard = '/dashboard';
  static const String learning = '/learning';
  static const String projects = '/projects';
  static const String chat = '/chat';
  static const String calendar = '/calendar';
  static const String settings = '/settings';
  static const String showcase = '/showcase';
  static const String ideas = '/ideas';
  static const String bookmarks = '/bookmarks';
  static const String insights = '/insights';
}

/// Router provider for Riverpod
final routerProvider = Provider<GoRouter>((ref) => appRouter);

/// App router configuration with deep linking support
final appRouter = GoRouter(
  initialLocation: AppRoutes.splash,
  debugLogDiagnostics: true,

  // Deep link path configuration
  routes: [
    // Splash screen
    GoRoute(
      path: AppRoutes.splash,
      builder: (context, state) => const SplashScreen(),
    ),

    // Auth routes
    GoRoute(
      path: AppRoutes.login,
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: AppRoutes.onboarding,
      builder: (context, state) => const OnboardingScreen(),
    ),

    // Main app routes with bottom navigation shell
    ShellRoute(
      builder: (context, state, child) => MainShell(child: child),
      routes: [
        GoRoute(
          path: AppRoutes.dashboard,
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: AppRoutes.learning,
          builder: (context, state) => const LearningScreen(),
        ),
        GoRoute(
          path: AppRoutes.projects,
          builder: (context, state) => const ProjectsScreen(),
        ),
        GoRoute(
          path: AppRoutes.chat,
          builder: (context, state) => const ChatScreen(),
        ),
        GoRoute(
          path: AppRoutes.calendar,
          builder: (context, state) => const CalendarScreen(),
        ),
      ],
    ),

    // Settings (outside shell for full screen)
    GoRoute(
      path: AppRoutes.settings,
      builder: (context, state) => const SettingsScreen(),
    ),

    // New Feature Routes
    GoRoute(
      path: AppRoutes.showcase,
      builder: (context, state) => const ShowcaseScreen(),
    ),
    GoRoute(
      path: AppRoutes.ideas,
      builder: (context, state) => const IdeasScreen(),
    ),
    GoRoute(
      path: AppRoutes.bookmarks,
      builder: (context, state) => const BookmarksScreen(),
    ),
    GoRoute(
      path: AppRoutes.insights,
      builder: (context, state) => const InsightsScreen(),
    ),

    // Deep link routes
    GoRoute(
      path: '/log/:id',
      redirect: (context, state) {
        // Redirect to learning with specific log
        return '${AppRoutes.learning}?logId=${state.pathParameters['id']}';
      },
    ),
    GoRoute(
      path: '/project/:id',
      redirect: (context, state) {
        // Redirect to projects with specific project
        return '${AppRoutes.projects}?projectId=${state.pathParameters['id']}';
      },
    ),
    GoRoute(
      path: '/task/:id',
      redirect: (context, state) {
        // Redirect to calendar with specific task
        return '${AppRoutes.calendar}?taskId=${state.pathParameters['id']}';
      },
    ),
  ],

  // Error page
  errorBuilder: (context, state) => ErrorScreen(error: state.error),
);

/// Main shell with bottom navigation
class MainShell extends StatefulWidget {
  final Widget child;

  const MainShell({super.key, required this.child});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _getSelectedIndex(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    if (location.startsWith(AppRoutes.dashboard)) return 0;
    if (location.startsWith(AppRoutes.learning)) return 1;
    if (location.startsWith(AppRoutes.projects)) return 2;
    if (location.startsWith(AppRoutes.chat)) return 3;
    if (location.startsWith(AppRoutes.calendar)) return 4;
    return 0;
  }

  void _onItemTapped(BuildContext context, int index) {
    switch (index) {
      case 0:
        context.go(AppRoutes.dashboard);
        break;
      case 1:
        context.go(AppRoutes.learning);
        break;
      case 2:
        context.go(AppRoutes.projects);
        break;
      case 3:
        context.go(AppRoutes.chat);
        break;
      case 4:
        context.go(AppRoutes.calendar);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _getSelectedIndex(context),
        onDestinationSelected: (index) => _onItemTapped(context, index),
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.primary.withOpacity(0.2),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard, color: AppColors.primary),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.school_outlined),
            selectedIcon: Icon(Icons.school, color: AppColors.primary),
            label: 'Learn',
          ),
          NavigationDestination(
            icon: Icon(Icons.folder_outlined),
            selectedIcon: Icon(Icons.folder, color: AppColors.primary),
            label: 'Projects',
          ),
          NavigationDestination(
            icon: Icon(Icons.chat_outlined),
            selectedIcon: Icon(Icons.chat, color: AppColors.primary),
            label: 'AI Chat',
          ),
          NavigationDestination(
            icon: Icon(Icons.calendar_today_outlined),
            selectedIcon: Icon(Icons.calendar_today, color: AppColors.primary),
            label: 'Tasks',
          ),
        ],
      ),
    );
  }
}

/// Error screen for navigation errors
class ErrorScreen extends StatelessWidget {
  final Exception? error;

  const ErrorScreen({super.key, this.error});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text('Oops! Page not found',
                style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(error?.toString() ?? 'Unknown error',
                style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(AppRoutes.dashboard),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    );
  }
}
