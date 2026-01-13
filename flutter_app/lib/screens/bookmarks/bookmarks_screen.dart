import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/bookmark_provider.dart';

class BookmarksScreen extends ConsumerStatefulWidget {
  const BookmarksScreen({super.key});

  @override
  ConsumerState<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends ConsumerState<BookmarksScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(bookmarkProvider.notifier).fetchBookmarks());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(bookmarkProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookmarks'),
        centerTitle: true,
      ),
      body: state.isLoading && state.bookmarks.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : state.bookmarks.isEmpty
              ? const Center(child: Text('No bookmarks yet'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: state.bookmarks.length,
                  itemBuilder: (context, index) {
                    final bookmark = state.bookmarks[index];
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        child: Text(
                          bookmark['name']?[0]?.toUpperCase() ?? '?',
                        ),
                      ),
                      title: Text(bookmark['name'] ?? 'Unknown Repo'),
                      subtitle: Text(bookmark['description'] ?? ''),
                      trailing: IconButton(
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () {
                           ref
                            .read(bookmarkProvider.notifier)
                            .removeBookmark(bookmark['repoId'] ?? bookmark['id']);
                        },
                      ),
                      onTap: () {
                        if (bookmark['url'] != null) {
                          launchUrl(Uri.parse(bookmark['url']));
                        }
                      },
                    );
                  },
                ),
    );
  }
}
