import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/theme.dart';
import '../../providers/showcase_provider.dart';

class ShowcaseScreen extends ConsumerStatefulWidget {
  const ShowcaseScreen({super.key});

  @override
  ConsumerState<ShowcaseScreen> createState() => _ShowcaseScreenState();
}

class _ShowcaseScreenState extends ConsumerState<ShowcaseScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(showcaseProvider.notifier).fetchAll());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(showcaseProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Showcase'),
        centerTitle: true,
      ),
      body: state.isLoading
          ? const Center(child: CircularProgressIndicator())
          : state.error != null
              ? Center(child: Text('Error: ${state.error}'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.showcaseProjects.length,
                  itemBuilder: (context, index) {
                    final project = state.showcaseProjects[index];
                    return _ShowcaseCard(project: project);
                  },
                ),
    );
  }
}

class _ShowcaseCard extends ConsumerWidget {
  final Map<String, dynamic> project;

  const _ShowcaseCard({required this.project});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (project['image'] != null && project['image'].isNotEmpty)
            Image.network(
              project['image'],
              height: 150,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                height: 150,
                color: AppColors.surface,
                alignment: Alignment.center,
                child: const Icon(Icons.image_not_supported, size: 40),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        project['title'] ?? 'Untitled',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        (project['likes'] as List?)?.contains('me') ?? false
                            ? Icons.favorite
                            : Icons.favorite_border,
                        color: AppColors.accent,
                      ),
                      onPressed: () {
                         ref.read(showcaseProvider.notifier).toggleStar(project['_id'] ?? project['id']);
                      },
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  project['description'] ?? 'No description',
                  style: Theme.of(context).textTheme.bodyMedium,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    if (project['demoUrl'] != null)
                      TextButton.icon(
                        icon: const Icon(Icons.language),
                        label: const Text('Demo'),
                        onPressed: () => launchUrl(Uri.parse(project['demoUrl'])),
                      ),
                    if (project['githubUrl'] != null)
                      TextButton.icon(
                        icon: const Icon(Icons.code),
                        label: const Text('Code'),
                        onPressed: () => launchUrl(Uri.parse(project['githubUrl'])),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
