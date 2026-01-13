import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../providers/ideas_provider.dart';

class IdeasScreen extends ConsumerStatefulWidget {
  const IdeasScreen({super.key});

  @override
  ConsumerState<IdeasScreen> createState() => _IdeasScreenState();
}

class _IdeasScreenState extends ConsumerState<IdeasScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    Future.microtask(() => ref.read(ideasProvider.notifier).fetchSavedIdeas());
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ideasProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Project Ideas'),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Generate'),
            Tab(text: 'Saved'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _GenerateTab(state: state),
          _SavedTab(state: state),
        ],
      ),
    );
  }
}

class _GenerateTab extends ConsumerWidget {
  final IdeasState state;

  const _GenerateTab({required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lightbulb_outline, size: 64, color: AppColors.accent),
            const SizedBox(height: 24),
            Text(
              'Need Inspiration?',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            const Text(
              'Let AI generate a project idea for you.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: state.isGenerating
                  ? null
                  : () {
                      ref.read(ideasProvider.notifier).generateIdeas({
                        'type': 'random',
                      });
                    },
              child: state.isGenerating
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Generate Idea'),
            ),
            if (state.generatedIdea != null) ...[
              const SizedBox(height: 32),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Text(
                        state.generatedIdea['title'] ?? 'New Idea',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Text(state.generatedIdea['description'] ?? ''),
                      const SizedBox(height: 16),
                      OutlinedButton(
                        onPressed: () {
                          ref.read(ideasProvider.notifier).saveIdea({
                             ...state.generatedIdea,
                             'savedAt': DateTime.now().toIso8601String(),
                          });
                        },
                        child: const Text('Save This Idea'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SavedTab extends ConsumerWidget {
  final IdeasState state;

  const _SavedTab({required this.state});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (state.isLoading && state.savedIdeas.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.savedIdeas.isEmpty) {
      return const Center(child: Text('No saved ideas yet'));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: state.savedIdeas.length,
      itemBuilder: (context, index) {
        final idea = state.savedIdeas[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text(idea['title'] ?? 'Untitled'),
            subtitle: Text(
              idea['description'] ?? '',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            trailing: IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: () {
                ref.read(ideasProvider.notifier).removeIdea(idea['_id'] ?? idea['id']);
              },
            ),
          ),
        );
      },
    );
  }
}
