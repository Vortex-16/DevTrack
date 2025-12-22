// This is a basic Flutter widget test.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:devtrack_app/app.dart';

void main() {
  testWidgets('App renders correctly', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      const ProviderScope(
        child: DevTrackApp(),
      ),
    );

    // Verify that DevTrack text exists
    expect(find.text('DevTrack'), findsWidgets);
  });
}
