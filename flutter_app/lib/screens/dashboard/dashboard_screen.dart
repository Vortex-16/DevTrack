import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../config/router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/log_provider.dart';
import '../../widgets/app_drawer.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Fetch data on mount
    Future.microtask(() {
      ref.read(logStateProvider.notifier).fetchLogs(refresh: true);
      ref.read(logStateProvider.notifier).fetchStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authStateProvider);
    final logState = ref.watch(logStateProvider);
    final user = authState.user;
    final stats = logState.stats;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await ref.read(logStateProvider.notifier).fetchLogs(refresh: true);
            await ref.read(logStateProvider.notifier).fetchStats();
          },
          child: CustomScrollView(
            slivers: [
              // App Bar
              SliverAppBar(
                floating: true,
                title: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: Image.asset(
                        'assets/images/DevTrack.png',
                        width: 40,
                        height: 40,
                        fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text('DevTrack'),
                  ],
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () {},
                  ),
                  GestureDetector(
                    onTap: () => context.go(AppRoutes.settings),
                    child: Container(
                      margin: const EdgeInsets.only(right: 16),
                      child: CircleAvatar(
                        radius: 18,
                        backgroundColor: AppColors.primary,
                        backgroundImage: user?.avatarUrl != null
                            ? NetworkImage(user!.avatarUrl!)
                            : null,
                        child: user?.avatarUrl == null
                            ? Text(
                                user?.name.isNotEmpty == true
                                    ? user!.name[0].toUpperCase()
                                    : '?',
                                style: const TextStyle(color: Colors.white),
                              )
                            : null,
                      ),
                    ),
                  ),
                ],
              ),

              // Content
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Welcome message
                    Text(
                      'Welcome back, ${user?.name.split(' ').first ?? 'Developer'}! 👋',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ).animate().fadeIn().slideX(begin: -0.1),
                    const SizedBox(height: 4),
                    Text(
                      'Ready to continue your journey?',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ).animate().fadeIn(delay: 100.ms),
                    const SizedBox(height: 24),

                    // Stats Grid
                    if (logState.isLoading && stats == null)
                      const Center(child: CircularProgressIndicator())
                    else
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 1.4,
                        children: [
                          _StatCard(
                            icon: Icons.local_fire_department,
                            iconColor: AppColors.accentOrange,
                            value: '${stats?.currentStreak ?? 0}',
                            label: 'Day Streak',
                          )
                              .animate()
                              .fadeIn(delay: 200.ms)
                              .scale(begin: const Offset(0.9, 0.9)),
                          _StatCard(
                            icon: Icons.access_time,
                            iconColor: AppColors.accentGreen,
                            value:
                                '${stats?.totalHours.toStringAsFixed(1) ?? '0'}h',
                            label: 'Total Hours',
                          )
                              .animate()
                              .fadeIn(delay: 300.ms)
                              .scale(begin: const Offset(0.9, 0.9)),
                          _StatCard(
                            icon: Icons.edit_note,
                            iconColor: AppColors.primary,
                            value: '${stats?.totalEntries ?? 0}',
                            label: 'Entries',
                          )
                              .animate()
                              .fadeIn(delay: 400.ms)
                              .scale(begin: const Offset(0.9, 0.9)),
                          _StatCard(
                            icon: Icons.trending_up,
                            iconColor: AppColors.accent,
                            value: '${stats?.longestStreak ?? 0}',
                            label: 'Best Streak',
                          )
                              .animate()
                              .fadeIn(delay: 500.ms)
                              .scale(begin: const Offset(0.9, 0.9)),
                        ],
                      ),

                    const SizedBox(height: 24),

                    // Weekly Activity Section
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '📊 Weekly Activity',
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              TextButton(
                                onPressed: () => context.go(AppRoutes.learning),
                                child: const Text('View All'),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            height: 150,
                            child: _WeeklyChart(
                              data: stats?.weeklyActivity ?? [],
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 600.ms),

                    const SizedBox(height: 24),

                    // Recent Activity
                    Text(
                      '⏱️ Recent Entries',
                      style: Theme.of(context).textTheme.titleLarge,
                    ).animate().fadeIn(delay: 700.ms),
                    const SizedBox(height: 12),

                    if (logState.entries.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(32),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.edit_note,
                                size: 48, color: AppColors.textMuted),
                            const SizedBox(height: 12),
                            Text(
                              'No entries yet',
                              style: Theme.of(context).textTheme.titleMedium,
                            ),
                            const SizedBox(height: 8),
                            ElevatedButton(
                              onPressed: () => context.go(AppRoutes.learning),
                              child: const Text('Add Your First Entry'),
                            ),
                          ],
                        ),
                      ).animate().fadeIn(delay: 800.ms)
                    else
                      ...logState.entries.take(3).map((entry) => Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Row(
                              children: [
                                Text(entry.mood,
                                    style: const TextStyle(fontSize: 24)),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        entry.description,
                                        style: Theme.of(context)
                                            .textTheme
                                            .bodyMedium,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      if (entry.tags.isNotEmpty)
                                        Wrap(
                                          spacing: 4,
                                          children: entry.tags
                                              .take(3)
                                              .map((tag) => Container(
                                                    padding: const EdgeInsets
                                                        .symmetric(
                                                        horizontal: 8,
                                                        vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: AppColors.primary
                                                          .withOpacity(0.1),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              4),
                                                    ),
                                                    child: Text(
                                                      tag,
                                                      style: const TextStyle(
                                                          fontSize: 10,
                                                          color: AppColors
                                                              .primary),
                                                    ),
                                                  ))
                                              .toList(),
                                        ),
                                    ],
                                  ),
                                ),
                                Text(
                                  '${entry.durationHours.toStringAsFixed(1)}h',
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(
                                        color: AppColors.accentGreen,
                                      ),
                                ),
                              ],
                            ),
                          )),

                    const SizedBox(height: 100),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String value;
  final String label;

  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              Text(label, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ],
      ),
    );
  }
}

class _WeeklyChart extends StatelessWidget {
  final List<dynamic> data;

  const _WeeklyChart({required this.data});

  @override
  Widget build(BuildContext context) {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final maxHours = data.isNotEmpty
        ? data
            .map((d) => (d.hours as num?) ?? 0)
            .reduce((a, b) => a > b ? a : b)
        : 5;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: List.generate(7, (index) {
        final hours =
            index < data.length ? ((data[index].hours as num?) ?? 0) : 0;
        final height =
            maxHours > 0 ? (hours / maxHours * 100).clamp(10, 100) : 10;

        return Column(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Container(
              width: 28,
              height: height.toDouble(),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(6),
              ),
            ),
            const SizedBox(height: 8),
            Text(days[index], style: Theme.of(context).textTheme.bodySmall),
          ],
        );
      }),
    );
  }
}
