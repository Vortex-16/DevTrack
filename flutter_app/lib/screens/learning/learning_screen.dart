import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:ui';
import '../../config/theme.dart';
import '../../models/log_entry.dart';
import '../../providers/log_provider.dart';

class LearningScreen extends ConsumerStatefulWidget {
  const LearningScreen({super.key});

  @override
  ConsumerState<LearningScreen> createState() => _LearningScreenState();
}

class _LearningScreenState extends ConsumerState<LearningScreen> {
  bool _showAddForm = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(logStateProvider.notifier).fetchLogs(refresh: true);
      ref.read(logStateProvider.notifier).fetchStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    final logState = ref.watch(logStateProvider);
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
              // Premium App Bar with Gradient
              SliverAppBar(
                floating: true,
                expandedHeight: 120,
                flexibleSpace: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryDark],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: FlexibleSpaceBar(
                    title: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.auto_stories_rounded, size: 20, color: Colors.white),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          'Learning Tracker',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    centerTitle: true,
                  ),
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.filter_list_rounded, color: Colors.white),
                    onPressed: () {},
                  ),
                  IconButton(
                    icon: const Icon(Icons.search_rounded, color: Colors.white),
                    onPressed: () {},
                  ),
                ],
              ),

              // Content
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Premium Stats Row with Glassmorphism
                    Row(
                      children: [
                        _PremiumStatCard(
                          label: 'Today',
                          value: '${stats?.weeklyActivity.isNotEmpty == true ? stats!.weeklyActivity.last.hours.toStringAsFixed(1) : '0'}h',
                          color: AppColors.accentGreen,
                          icon: Icons.today_rounded,
                        ),
                        const SizedBox(width: 12),
                        _PremiumStatCard(
                          label: 'Total',
                          value: '${stats?.totalHours.toStringAsFixed(0) ?? '0'}h',
                          color: AppColors.primary,
                          icon: Icons.timer_rounded,
                        ),
                        const SizedBox(width: 12),
                        _PremiumStatCard(
                          label: 'Streak',
                          value: '${stats?.currentStreak ?? 0}',
                          color: AppColors.accentOrange,
                          icon: Icons.local_fire_department_rounded,
                          suffix: 'days',
                        ),
                      ],
                    )
                        .animate()
                        .fadeIn(duration: 600.ms)
                        .scale(begin: const Offset(0.9, 0.9), duration: 400.ms, curve: Curves.easeOutBack),

                    const SizedBox(height: 32),

                    // Add new entry section
                    if (_showAddForm) ...[
                      _PremiumAddEntryForm(
                        onCancel: () => setState(() => _showAddForm = false),
                        onSave: (entry) async {
                          setState(() => _showAddForm = false);
                          await ref.read(logStateProvider.notifier).addLog(entry);
                        },
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Section header with gradient accent
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 4,
                                height: 24,
                                decoration: BoxDecoration(
                                  gradient: AppColors.primaryGradient,
                                  borderRadius: BorderRadius.circular(2),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Recent Entries',
                                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 20,
                                    ),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  AppColors.primary.withOpacity(0.2),
                                  AppColors.primaryDark.withOpacity(0.1),
                                ],
                              ),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                            ),
                            child: Text(
                              '${logState.entries.length} entries',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Loading indicator
                    if (logState.isLoading && logState.entries.isEmpty)
                      const Center(child: CircularProgressIndicator())
                    else if (logState.entries.isEmpty)
                      _PremiumEmptyState(onAddEntry: () => setState(() => _showAddForm = true))
                    else
                      ..._buildPremiumLearningEntries(logState.entries),

                    const SizedBox(height: 100),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          gradient: _showAddForm
              ? const LinearGradient(colors: [AppColors.error, AppColors.accentRed])
              : AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: (_showAddForm ? AppColors.error : AppColors.primary).withOpacity(0.4),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: FloatingActionButton.extended(
          onPressed: () => setState(() => _showAddForm = !_showAddForm),
          icon: Icon(_showAddForm ? Icons.close_rounded : Icons.add_rounded),
          label: Text(_showAddForm ? 'Cancel' : 'Add Entry'),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
      )
          .animate(target: _showAddForm ? 1 : 0)
          .rotate(begin: 0, end: 0.125, duration: 200.ms)
          .then()
          .rotate(begin: 0.125, end: 0, duration: 200.ms),
    );
  }

  List<Widget> _buildPremiumLearningEntries(List<LogEntry> entries) {
    return entries.asMap().entries.map((entry) {
      final log = entry.value;
      return Container(
        margin: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppColors.surface,
              AppColors.surfaceLight.withOpacity(0.5),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: AppColors.border,
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              // Accent Line
              Positioned(
                left: 0,
                top: 0,
                bottom: 0,
                child: Container(
                  width: 5,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppColors.primary,
                        AppColors.accentGreen,
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header with Gradient
                  Container(
                    padding: const EdgeInsets.fromLTRB(20, 16, 16, 16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.surfaceLight.withOpacity(0.3),
                          Colors.transparent,
                        ],
                      ),
                      border: const Border(
                        bottom: BorderSide(color: AppColors.border, width: 1),
                      ),
                    ),
                    child: Row(
                      children: [
                        // Mood with background
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                AppColors.primary.withOpacity(0.2),
                                AppColors.accent.withOpacity(0.1),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(log.mood, style: const TextStyle(fontSize: 28)),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.calendar_today_rounded,
                                      size: 14, color: AppColors.textMuted),
                                  const SizedBox(width: 6),
                                  Text(
                                    _formatDate(log.date),
                                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                          fontWeight: FontWeight.w500,
                                        ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      AppColors.accentGreen.withOpacity(0.2),
                                      AppColors.accentGreen.withOpacity(0.1),
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: AppColors.accentGreen.withOpacity(0.3),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.timer_rounded,
                                        size: 14, color: AppColors.accentGreen),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${log.durationHours.toStringAsFixed(1)}h',
                                      style: Theme.of(context).textTheme.titleSmall?.copyWith(
                                            color: AppColors.accentGreen,
                                            fontWeight: FontWeight.bold,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          decoration: BoxDecoration(
                            color: AppColors.surfaceLight,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: PopupMenuButton<String>(
                            icon: const Icon(Icons.more_vert_rounded, color: AppColors.textMuted),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            onSelected: (value) {
                              if (value == 'delete') {
                                ref.read(logStateProvider.notifier).deleteLog(log.id);
                              }
                            },
                            itemBuilder: (context) => [
                              const PopupMenuItem(
                                value: 'edit',
                                child: Row(
                                  children: [
                                    Icon(Icons.edit_rounded, size: 18),
                                    SizedBox(width: 12),
                                    Text('Edit'),
                                  ],
                                ),
                              ),
                              const PopupMenuItem(
                                value: 'delete',
                                child: Row(
                                  children: [
                                    Icon(Icons.delete_rounded, size: 18, color: AppColors.error),
                                    SizedBox(width: 12),
                                    Text('Delete', style: TextStyle(color: AppColors.error)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Content
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          log.description,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                height: 1.6,
                                color: AppColors.textSecondary,
                              ),
                        ),
                        if (log.tags.isNotEmpty) ...[
                          const SizedBox(height: 16),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: log.tags
                                .map((tag) => Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            AppColors.primary.withOpacity(0.15),
                                            AppColors.accent.withOpacity(0.1),
                                          ],
                                        ),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(
                                          color: AppColors.primary.withOpacity(0.4),
                                        ),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            width: 6,
                                            height: 6,
                                            decoration: const BoxDecoration(
                                              color: AppColors.primary,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                          const SizedBox(width: 6),
                                          Text(
                                            tag,
                                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                                  color: AppColors.primary,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                          ),
                                        ],
                                      ),
                                    ))
                                .toList(),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      )
          .animate(delay: (150 + entry.key * 80).ms)
          .fadeIn(duration: 400.ms)
          .slideY(begin: 0.1, end: 0, curve: Curves.easeOutQuart);
    }).toList();
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (date.year == now.year && date.month == now.month && date.day == now.day) {
      return 'Today';
    }
    if (date.year == now.year && date.month == now.month && date.day == now.day - 1) {
      return 'Yesterday';
    }
    return '${date.day}/${date.month}/${date.year}';
  }
}

// Premium Stat Card with Glassmorphism
class _PremiumStatCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;
  final String? suffix;

  const _PremiumStatCard({
    required this.label,
    required this.value,
    required this.color,
    required this.icon,
    this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              color.withOpacity(0.15),
              color.withOpacity(0.05),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: color.withOpacity(0.4),
            width: 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.2),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  value,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        color: color,
                        fontWeight: FontWeight.bold,
                        fontSize: 24,
                      ),
                ),
                if (suffix != null)
                  Padding(
                    padding: const EdgeInsets.only(left: 4, bottom: 2),
                    child: Text(
                      suffix!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: color.withOpacity(0.8),
                            fontWeight: FontWeight.w600,
                          ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.5,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}

// Premium Empty State
class _PremiumEmptyState extends StatelessWidget {
  final VoidCallback onAddEntry;

  const _PremiumEmptyState({required this.onAddEntry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(48),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.surface,
            AppColors.surfaceLight.withOpacity(0.5),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: AppColors.border,
          width: 1.5,
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary.withOpacity(0.2),
                  AppColors.accent.withOpacity(0.1),
                ],
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.auto_stories_rounded,
              size: 56,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'No learning entries yet',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          Text(
            'Start tracking your learning journey today!',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: AppColors.textMuted,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Container(
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withOpacity(0.3),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: ElevatedButton.icon(
              onPressed: onAddEntry,
              icon: const Icon(Icons.add_rounded),
              label: const Text('Add First Entry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 600.ms).scale(begin: const Offset(0.95, 0.95));
  }
}

// Premium Add Entry Form
class _PremiumAddEntryForm extends StatefulWidget {
  final VoidCallback onCancel;
  final Function(LogEntry) onSave;

  const _PremiumAddEntryForm({required this.onCancel, required this.onSave});

  @override
  State<_PremiumAddEntryForm> createState() => _PremiumAddEntryFormState();
}

class _PremiumAddEntryFormState extends State<_PremiumAddEntryForm> {
  final _descriptionController = TextEditingController();
  final List<String> _selectedTags = [];
  String _selectedMood = '😊';

  final moods = ['😊', '😐', '😕', '😫', '🤩'];
  final suggestedTags = ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Flutter', 'Python'];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.surface,
            AppColors.surfaceLight.withOpacity(0.6),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          width: 2,
          color: AppColors.primary.withOpacity(0.5),
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.add_circle_outline_rounded, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 12),
              Text(
                'New Learning Entry',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          TextField(
            controller: _descriptionController,
            maxLines: 4,
            decoration: InputDecoration(
              labelText: 'What did you learn?',
              hintText: 'Describe what you learned today...',
              prefixIcon: const Icon(Icons.edit_note_rounded),
              filled: true,
              fillColor: AppColors.background.withOpacity(0.5),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              const Icon(Icons.label_rounded, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                'Tags',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: suggestedTags.map((tag) {
              final isSelected = _selectedTags.contains(tag);
              return InkWell(
                onTap: () {
                  setState(() {
                    if (isSelected) {
                      _selectedTags.remove(tag);
                    } else {
                      _selectedTags.add(tag);
                    }
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? AppColors.primaryGradient
                        : LinearGradient(
                            colors: [
                              AppColors.surfaceLight,
                              AppColors.surface,
                            ],
                          ),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.border,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Text(
                    tag,
                    style: TextStyle(
                      color: isSelected ? Colors.white : AppColors.textSecondary,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                      fontSize: 13,
                    ),
                  ),
                ),
              ).animate(target: isSelected ? 1 : 0).scale(
                    begin: const Offset(1, 1),
                    end: const Offset(1.05, 1.05),
                    duration: 150.ms,
                  );
            }).toList(),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              const Icon(Icons.sentiment_satisfied_rounded, size: 20, color: AppColors.accentOrange),
              const SizedBox(width: 8),
              Text(
                'How was it?',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: moods.map((mood) {
              final isSelected = _selectedMood == mood;
              return GestureDetector(
                onTap: () => setState(() => _selectedMood = mood),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    gradient: isSelected
                        ? LinearGradient(
                            colors: [
                              AppColors.primary.withOpacity(0.3),
                              AppColors.accent.withOpacity(0.2),
                            ],
                          )
                        : null,
                    color: isSelected ? null : AppColors.surfaceLight,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.border,
                      width: isSelected ? 2.5 : 1,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: AppColors.primary.withOpacity(0.3),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Text(mood, style: const TextStyle(fontSize: 32)),
                ),
              )
                  .animate(target: isSelected ? 1 : 0)
                  .scale(begin: const Offset(1, 1), end: const Offset(1.1, 1.1), duration: 200.ms);
            }).toList(),
          ),
          const SizedBox(height: 28),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: widget.onCancel,
                  icon: const Icon(Icons.close_rounded),
                  label: const Text('Cancel'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    side: const BorderSide(color: AppColors.border, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.4),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ElevatedButton.icon(
                    onPressed: () {
                      if (_descriptionController.text.isEmpty) return;
                      final entry = LogEntry(
                        id: '',
                        userId: '',
                        date: DateTime.now(),
                        description: _descriptionController.text,
                        tags: _selectedTags,
                        mood: _selectedMood,
                        createdAt: DateTime.now(),
                      );
                      widget.onSave(entry);
                    },
                    icon: const Icon(Icons.check_rounded),
                    label: const Text('Save Entry'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.05, curve: Curves.easeOutQuart);
  }
}
