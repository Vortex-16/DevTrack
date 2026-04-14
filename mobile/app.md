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
Goal: Implement all crucial web features natively.

Projects & Showcase: Native list views for managing and showcasing projects. Implementing the custom swipe-to-delete or edit actions.
GitHub Insights: Direct API calls to the DevTrack backend to fetch cached GitHub graph data, displayed using React Native charting libraries (e.g., react-native-chart-kit or react-native-gifted-charts).
Learning & Roadmap: Native interactive timeline/progress displays.
Chat: Real-time chat UI (likely using react-native-gifted-chat) connecting to the backend's AI.
Phase 4: Push Notifications & Fine-Tuning (The Nerves)
Goal: Keep users engaged and polish the User Experience.

FCM Notifications: Implement Expo Push Notifications mapped to Firebase Cloud Messaging (building upon the web's recent FCM fixes). Register mobile device tokens to the user's DB profile.
Micro-animations: Implement smooth transitions and dynamic interactions using react-native-reanimated.
Dark Mode / Theming: Ensure robust theme switching matching the web app's aesthetics.
ain React Native stylesheets / Nativewind?
