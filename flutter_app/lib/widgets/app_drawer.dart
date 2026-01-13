import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/router.dart';
import '../../config/theme.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Column(
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.code, size: 48, color: Colors.white),
                    SizedBox(height: 12),
                    Text(
                      'DevTrack',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.public),
              title: const Text('Community Showcase'),
              onTap: () {
                context.pop(); // Close drawer
                context.push(AppRoutes.showcase);
              },
            ),
            ListTile(
              leading: const Icon(Icons.lightbulb_outline),
              title: const Text('Project Ideas'),
              onTap: () {
                context.pop();
                context.push(AppRoutes.ideas);
              },
            ),
            ListTile(
              leading: const Icon(Icons.bookmark_border),
              title: const Text('Bookmarks'),
              onTap: () {
                context.pop();
                context.push(AppRoutes.bookmarks);
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('Settings'),
              onTap: () {
                context.pop();
                context.push(AppRoutes.settings);
              },
            ),
          ],
        ),
      ),
    );
  }
}
