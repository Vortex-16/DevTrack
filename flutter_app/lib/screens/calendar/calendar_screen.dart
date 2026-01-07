import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../config/theme.dart';
import '../../models/task.dart';
import '../../providers/task_provider.dart';

class CalendarScreen extends ConsumerStatefulWidget {
  const CalendarScreen({super.key});

  @override
  ConsumerState<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends ConsumerState<CalendarScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(taskStateProvider.notifier).fetchTasks();
    });
  }

  @override
  Widget build(BuildContext context) {
    final taskState = ref.watch(taskStateProvider);
    final selectedDate = taskState.selectedDate;
    final tasksForDate = taskState.tasksForSelectedDate;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () async {
            await ref.read(taskStateProvider.notifier).fetchTasks();
          },
          child: CustomScrollView(
            slivers: [
              const SliverAppBar(floating: true, title: Text('📅 Calendar')),
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // Calendar header
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.chevron_left),
                                onPressed: () => _changeMonth(-1),
                              ),
                              Text(_getMonthYear(selectedDate),
                                  style:
                                      Theme.of(context).textTheme.titleLarge),
                              IconButton(
                                icon: const Icon(Icons.chevron_right),
                                onPressed: () => _changeMonth(1),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              'Mon',
                              'Tue',
                              'Wed',
                              'Thu',
                              'Fri',
                              'Sat',
                              'Sun'
                            ]
                                .map((day) => SizedBox(
                                      width: 40,
                                      child: Text(day,
                                          style: Theme.of(context)
                                              .textTheme
                                              .bodySmall,
                                          textAlign: TextAlign.center),
                                    ))
                                .toList(),
                          ),
                          const SizedBox(height: 8),
                          _buildCalendarGrid(taskState),
                        ],
                      ),
                    ).animate().fadeIn().slideY(begin: 0.1),

                    const SizedBox(height: 24),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Tasks for ${_formatDate(selectedDate)}',
                            style: Theme.of(context).textTheme.titleLarge),
                        TextButton.icon(
                          onPressed: () => _showAddTaskDialog(context),
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Add Task'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    if (taskState.isLoading && taskState.tasks.isEmpty)
                      const Center(child: CircularProgressIndicator())
                    else if (tasksForDate.isEmpty)
                      _EmptyState()
                    else
                      ..._buildTaskList(tasksForDate),

                    const SizedBox(height: 100),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddTaskDialog(context),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildCalendarGrid(TaskState state) {
    final selectedDate = state.selectedDate;
    final firstDayOfMonth = DateTime(selectedDate.year, selectedDate.month, 1);
    final lastDayOfMonth =
        DateTime(selectedDate.year, selectedDate.month + 1, 0);
    
    // Dart's weekday: 1 (Mon) to 7 (Sun)
    // For a grid starting on Monday, we need (startingWeekday - 1) prefix spaces
    final prefixSpaces = firstDayOfMonth.weekday - 1;
    final totalCells = prefixSpaces + lastDayOfMonth.day;

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 7,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
      ),
      itemCount: totalCells,
      itemBuilder: (context, index) {
        if (index < prefixSpaces) {
          return const SizedBox.shrink();
        }

        final day = index - prefixSpaces + 1;
        final date = DateTime(selectedDate.year, selectedDate.month, day);
        final isToday = _isToday(date);
        final isSelected = _isSameDay(date, selectedDate);
        final taskCount = state.getTaskCountForDate(date);

        return GestureDetector(
          onTap: () =>
              ref.read(taskStateProvider.notifier).changeSelectedDate(date),
          child: Container(
            decoration: BoxDecoration(
              gradient: isSelected ? AppColors.primaryGradient : null,
              color: isToday && !isSelected
                  ? AppColors.primary.withOpacity(0.1)
                  : null,
              borderRadius: BorderRadius.circular(10),
              border: isToday && !isSelected
                  ? Border.all(color: AppColors.primary)
                  : null,
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Text('$day',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: isSelected
                              ? Colors.white
                              : isToday
                                  ? AppColors.primary
                                  : AppColors.textPrimary,
                          fontWeight:
                              isToday || isSelected ? FontWeight.bold : null,
                        )),
                if (taskCount > 0)
                  Positioned(
                    bottom: 4,
                    child: Container(
                      width: 4,
                      height: 4,
                      decoration: BoxDecoration(
                        color:
                            isSelected ? Colors.white : AppColors.accentGreen,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  List<Widget> _buildTaskList(List<Task> tasks) {
    return tasks.asMap().entries.map((entry) {
      final task = entry.value;
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: ListTile(
          leading: Checkbox(
            value: task.isCompleted,
            onChanged: (value) {
              ref
                  .read(taskStateProvider.notifier)
                  .toggleTaskCompletion(task.id);
            },
            activeColor: AppColors.accentGreen,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
          ),
          title: Text(task.title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    decoration:
                        task.isCompleted ? TextDecoration.lineThrough : null,
                    color: task.isCompleted ? AppColors.textMuted : null,
                  )),
          subtitle: Row(
            children: [
              if (task.dueTime != null) ...[
                const Icon(Icons.access_time,
                    size: 14, color: AppColors.textMuted),
                const SizedBox(width: 4),
                Text(task.dueTime!,
                    style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(width: 12),
              ],
              _PriorityBadge(priority: task.priority),
            ],
          ),
          trailing: PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: AppColors.textMuted),
            onSelected: (value) {
              if (value == 'delete') {
                ref.read(taskStateProvider.notifier).deleteTask(task.id);
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'edit', child: Text('Edit')),
              const PopupMenuItem(value: 'delete', child: Text('Delete')),
            ],
          ),
        ),
      ).animate(delay: (200 + entry.key * 100).ms).fadeIn().slideX(begin: 0.1);
    }).toList();
  }

  void _showAddTaskDialog(BuildContext context) {
    final titleController = TextEditingController();
    TaskPriority selectedPriority = TaskPriority.medium;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Add New Task',
                  style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 20),
              TextField(
                controller: titleController,
                decoration: const InputDecoration(
                  labelText: 'Task Title',
                  prefixIcon: Icon(Icons.task),
                ),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<TaskPriority>(
                decoration: const InputDecoration(labelText: 'Priority'),
                initialValue: selectedPriority,
                items: TaskPriority.values
                    .map((p) =>
                        DropdownMenuItem(value: p, child: Text(p.displayName)))
                    .toList(),
                onChanged: (v) => setModalState(() => selectedPriority = v!),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    final task = Task(
                      id: '',
                      userId: '',
                      title: titleController.text,
                      dueDate: ref.read(taskStateProvider).selectedDate,
                      priority: selectedPriority,
                      createdAt: DateTime.now(),
                    );
                    ref.read(taskStateProvider.notifier).addTask(task);
                  },
                  child: const Text('Add Task'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _changeMonth(int delta) {
    final current = ref.read(taskStateProvider).selectedDate;
    ref.read(taskStateProvider.notifier).changeSelectedDate(
          DateTime(current.year, current.month + delta, 1),
        );
  }

  String _getMonthYear(DateTime date) {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];
    return '${months[date.month - 1]} ${date.year}';
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          const Icon(Icons.check_circle_outline,
              size: 48, color: AppColors.textMuted),
          const SizedBox(height: 12),
          Text('No tasks for this day',
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: AppColors.textMuted,
                  )),
        ],
      ),
    );
  }
}

class _PriorityBadge extends StatelessWidget {
  final TaskPriority priority;

  const _PriorityBadge({required this.priority});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (priority) {
      case TaskPriority.high:
        color = AppColors.accentRed;
        break;
      case TaskPriority.medium:
        color = AppColors.accentOrange;
        break;
      case TaskPriority.low:
        color = AppColors.accentGreen;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(priority.displayName,
          style: Theme.of(context)
              .textTheme
              .bodySmall
              ?.copyWith(color: color, fontSize: 10)),
    );
  }
}
