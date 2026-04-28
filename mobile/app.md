Phase 1: Foundation & Infrastructure (The Skeleton)
Goal: Establish the Expo project, configure core routing, and implement synchronized authentication.

Initialize Expo project (npx create-expo-app@latest DevTrack-Mobile).
Set up deep links and routing using Expo Router.
Auth Sync: Integrate @clerk/clerk-expo and SecureStore for token management. Ensure auto-redirection on expired sessions (similar to the web's recent AuthGuard fix).
Setup API Client (Axios) with interceptors to inject Clerk tokens, hitting the existing Render-hosted backend.
Setup UI Foundation: Install styling tools (e.g., Nativewind or Restyle) and port the core DevTrack color palette and typography.
Phase 2: Core Data Synchronization (The Brain)
Goal: Connect to the database and rebuild the Dashboard and Profile using shared data structures.

Integrate firebase JS SDK in the React Native environment. Set up real-time Snapshot listeners for key collections (Projects, Profile, Stats).
Build the Native Dashboard screen. Show identical metrics to the web app.
Build the Native Public/Private Profile screens.
Offline Support: Enable Firestore offline persistence so the app remains readable without an internet connection, queuing writes for when the connection returns.
Phase 3: Feature Parity & UI Overhaul (The Muscle)
Goal: Implement all crucial web features natively with premium "Fluency."

- **Projects & Showcase**: Native list views with Glassmorphism cards. Implementing custom swipe-to-delete or edit actions.
- **GitHub Insights**: Native charting (Wagmi Charts) for heatmap and growth data.
- **AI Growth Reports**: Integrated PDF viewer for the weekly AI-generated reports.
- **Learning & Roadmap**: Native interactive timeline/progress displays.

Phase 4: Push Notifications & Fine-Tuning (The Nerves)
Goal: Keep users engaged and polish the User Experience.

- **FCM Notifications**: Implementation with deep-linking to AI Reports and project tasks.
- **Micro-animations**: Use `react-native-reanimated` for shared element transitions and gesture-based navigation.
- **Haptic Feedback**: Integrate `expo-haptics` for tactile confirmation of actions.

Phase 5: AI Expert Mentor Mode
Goal: Bridge the gap with the upcoming web Phase 5.

- **Proactive Guidance**: Push-triggered AI suggestions based on inactivity.
- **Interactive Mentorship**: Enhanced chat UI with markdown support and code highlighting.

ain React Native stylesheets / Nativewind?
