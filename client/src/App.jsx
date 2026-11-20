import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { useEffect, useState, lazy, Suspense } from 'react';
import { ReactLenis } from 'lenis/react';
import AppLayout from './components/layout/AppLayout';
import ProfessionalLoader from './components/ui/ProfessionalLoader';
import Landing from './pages/Landing';

// Lazy-loaded routes for optimal initial bundle size (<150KB) and smooth navigation
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Learning = lazy(() => import('./pages/Learning'));
const Projects = lazy(() => import('./pages/Projects'));
const Chat = lazy(() => import('./pages/Chat'));
const SystemInfo = lazy(() => import('./pages/SystemInfo'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const MobileAuth = lazy(() => import('./pages/MobileAuth'));
const GitHubInsights = lazy(() => import('./pages/GitHubInsights'));
const Showcase = lazy(() => import('./pages/Showcase'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const ResumeBuilder = lazy(() => import('./pages/ResumeBuilder'));
const Roadmap = lazy(() => import('./pages/Roadmap'));
const NotFound = lazy(() => import('./pages/NotFound'));
const UserGuide = lazy(() => import('./pages/UserGuide'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Pricing = lazy(() => import('./pages/Pricing'));

import UpgradePrompt from './components/common/UpgradePrompt';
import CommandPalette from './components/common/CommandPalette';
import OnboardingTour from './components/common/OnboardingTour';
import { SubscriptionProvider, useSubscription } from './hooks/useSubscription';
import { preferencesApi, authApi } from './services/api';
import useHeartbeat from './hooks/useHeartbeat';
import { CacheProvider } from './context/CacheContext';

// Component that handles automatic onboarding redirect after signup
function OnboardingRedirect({ children }) {
    const { isSignedIn, isLoaded } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        const checkOnboarding = async () => {
            if (!isLoaded || !isSignedIn) {
                setChecking(false);
                return;
            }

            // Skip if already on onboarding page
            if (location.pathname === '/onboarding') {
                setChecking(false);
                return;
            }

            try {
                const response = await preferencesApi.get();
                const onboardingCompleted = response.data?.data?.onboardingCompleted;

                if (!onboardingCompleted) {
                    setNeedsOnboarding(true);
                    navigate('/onboarding', { replace: true });
                }
            } catch (error) {
                // If 404, user has no preferences - needs onboarding
                if (error.response?.status === 404) {
                    setNeedsOnboarding(true);
                    navigate('/onboarding', { replace: true });
                }
            } finally {
                setChecking(false);
            }
        };

        checkOnboarding();
    }, [isSignedIn, isLoaded, navigate, location.pathname]);

    if (checking && isSignedIn) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <ProfessionalLoader size="lg" />
            </div>
        );
    }

    if (needsOnboarding) {
        return null;
    }

    return children;
}

// Background component to keep backend user profile and tokens in sync with Clerk
function BackgroundSync() {
    const { isSignedIn, isLoaded, user } = useUser();
    const [synced, setSynced] = useState(false);
    const [renewed, setRenewed] = useState(false);
    const { refreshUsage } = useSubscription();

    useEffect(() => {
        const renewGithubAccessIfNeeded = async () => {
            if (!isLoaded || !isSignedIn || renewed) return;

            const params = new URLSearchParams(window.location.search);
            const shouldRenew = params.get('gh_access_renew') === '1';
            if (!shouldRenew) return;

            try {
                await authApi.renewGithubAccess();
            } catch (error) {
                console.error('Failed to renew GitHub private access window:', error);
            } finally {
                params.delete('gh_access_renew');
                const query = params.toString();
                const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash || ''}`;
                window.history.replaceState({}, '', nextUrl);
                setRenewed(true);
            }
        };

        renewGithubAccessIfNeeded();
    }, [isLoaded, isSignedIn, renewed]);

    useEffect(() => {
        const syncProfile = async () => {
            if (isLoaded && isSignedIn && !synced) {
                try {
                    // console.log('Syncing user profile with backend...');
                    await authApi.sync();
                    setSynced(true);
                    // console.log('Profile synced successfully');
                } catch (error) {
                    console.error('Failed to sync user profile:', error);
                }
            }
        };

        syncProfile();
    }, [isLoaded, isSignedIn, synced, user?.id]);

    useEffect(() => {
        if (!isLoaded || !isSignedIn) return;

        const params = new URLSearchParams(window.location.search);
        if (params.get('subscription') === 'success') {
            console.log('🎉 Stripe subscription success detected. Triggering instant sync...');
            refreshUsage();

            // Webhook might take a brief second, so poll every 2s (up to 5 times) to ensure sync
            let count = 0;
            const interval = setInterval(async () => {
                count++;
                console.log(`Polling for subscription update (${count}/5)...`);
                await refreshUsage();
                if (count >= 5) {
                    clearInterval(interval);
                }
            }, 2000);

            // Clean query param
            params.delete('subscription');
            const query = params.toString();
            const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash || ''}`;
            window.history.replaceState({}, '', nextUrl);

            return () => clearInterval(interval);
        }
    }, [isLoaded, isSignedIn, refreshUsage]);

    return null;
}

function App() {
    useHeartbeat();

    return (
        <ReactLenis root>
            <CacheProvider>
                <SubscriptionProvider>
                    <BackgroundSync />
                    <Suspense
                        fallback={
                            <div className="min-h-screen bg-[#fafafa] dark:bg-slate-950 flex items-center justify-center">
                                <ProfessionalLoader size="lg" />
                            </div>
                        }
                    >
                        <Routes>
                            {/* Public Routes */}
                            <Route
                                path="/"
                                element={
                                    <>
                                        <SignedOut>
                                            <Landing />
                                        </SignedOut>
                                        <SignedIn>
                                            <OnboardingRedirect>
                                                <Navigate to="/dashboard" replace />
                                            </OnboardingRedirect>
                                        </SignedIn>
                                    </>
                                }
                            />

                            {/* Public Profile Route */}
                            <Route path="/u/:username" element={<PublicProfile />} />
                            <Route
                                path="/resume"
                                element={
                                    <SignedIn>
                                        <OnboardingRedirect>
                                            <ResumeBuilder />
                                        </OnboardingRedirect>
                                    </SignedIn>
                                }
                            />

                            {/* Onboarding Route (Protected) */}
                            <Route
                                path="/onboarding"
                                element={
                                    <SignedIn>
                                        <Onboarding />
                                    </SignedIn>
                                }
                            />

                            {/* Protected Routes */}
                            <Route
                                element={
                                    <>
                                        <SignedIn>
                                            <OnboardingRedirect>
                                                <AppLayout />
                                            </OnboardingRedirect>
                                        </SignedIn>
                                        <SignedOut>
                                            <Navigate to="/?expired=true" replace />
                                        </SignedOut>
                                    </>
                                }
                            >
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/learning" element={<Learning />} />
                                <Route path="/roadmap" element={<Roadmap />} />
                                <Route path="/projects" element={<Projects />} />
                                <Route path="/chat" element={<Chat />} />
                                <Route path="/github-insights" element={<GitHubInsights />} />
                                <Route path="/showcase" element={<Showcase />} />
                                <Route path="/pricing" element={<Pricing />} />
                                <Route path="/system-info" element={<SystemInfo />} />
                                {/* Documentation Pages inside AppLayout */}
                                <Route path="/guide" element={<UserGuide />} />
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                            </Route>

                            {/* Preview Landing Page (for testing while signed in) */}
                            <Route path="/preview-landing" element={<Landing />} />

                            {/* Mobile Auth Page - for Flutter app authentication */}
                            <Route path="/mobile-auth" element={<MobileAuth />} />

                            {/* Catch all - 404 Not Found */}
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                    </Suspense>
                    <UpgradePrompt />
                    <CommandPalette />
                    <SignedIn>
                        <OnboardingTour />
                    </SignedIn>
                </SubscriptionProvider>
            </CacheProvider>
        </ReactLenis>
    );
}

export default App;
