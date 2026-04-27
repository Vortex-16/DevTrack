import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react"
import { useEffect, useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import ProfessionalLoader from './components/ui/ProfessionalLoader'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Learning from './pages/Learning'
import Projects from './pages/Projects'
import Chat from './pages/Chat'
import SystemInfo from './pages/SystemInfo'
import Onboarding from './pages/Onboarding'
import MobileAuth from './pages/MobileAuth'
import GitHubInsights from './pages/GitHubInsights'
import Showcase from './pages/Showcase'
import PublicProfile from './pages/PublicProfile'
import ResumeBuilder from './pages/ResumeBuilder'
import Roadmap from './pages/Roadmap'
import NotFound from './pages/NotFound'
import { preferencesApi } from './services/api'
import useHeartbeat from './hooks/useHeartbeat'
import Lenis from 'lenis'
import { CacheProvider } from './context/CacheContext'
import { authApi } from './services/api'

// Component that handles automatic onboarding redirect after signup
function OnboardingRedirect({ children }) {
    const { isSignedIn, isLoaded } = useUser()
    const navigate = useNavigate()
    const location = useLocation()
    const [checking, setChecking] = useState(true)
    const [needsOnboarding, setNeedsOnboarding] = useState(false)

    useEffect(() => {
        const checkOnboarding = async () => {
            if (!isLoaded || !isSignedIn) {
                setChecking(false)
                return
            }

            // Skip if already on onboarding page
            if (location.pathname === '/onboarding') {
                setChecking(false)
                return
            }

            try {
                const response = await preferencesApi.get()
                const onboardingCompleted = response.data?.data?.onboardingCompleted

                if (!onboardingCompleted) {
                    setNeedsOnboarding(true)
                    navigate('/onboarding', { replace: true })
                }
            } catch (error) {
                // If 404, user has no preferences - needs onboarding
                if (error.response?.status === 404) {
                    setNeedsOnboarding(true)
                    navigate('/onboarding', { replace: true })
                }
            } finally {
                setChecking(false)
            }
        }

        checkOnboarding()
    }, [isSignedIn, isLoaded, navigate, location.pathname])

    if (checking && isSignedIn) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <ProfessionalLoader size="lg" />
            </div>
        )
    }

    if (needsOnboarding) {
        return null
    }

    return children
}

// Background component to keep backend user profile and tokens in sync with Clerk
function BackgroundSync() {
    const { isSignedIn, isLoaded, user } = useUser();
    const [synced, setSynced] = useState(false);
    const [renewed, setRenewed] = useState(false);

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

    return null;
}


import { ReactLenis } from 'lenis/react'

// ... existing imports

function App() {
    useHeartbeat()

    return (
        <ReactLenis root>
            <CacheProvider>
                <BackgroundSync />
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={
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
                    } />

                    {/* Public Profile Route */}
                    <Route path="/u/:username" element={<PublicProfile />} />
                    <Route path="/resume" element={
                        <SignedIn>
                            <OnboardingRedirect>
                                <ResumeBuilder />
                            </OnboardingRedirect>
                        </SignedIn>
                    } />

                    {/* Onboarding Route (Protected) */}
                    <Route path="/onboarding" element={
                        <SignedIn>
                            <Onboarding />
                        </SignedIn>
                    } />

                    {/* Protected Routes */}
                    <Route element={
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
                    }>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/learning" element={<Learning />} />
                        <Route path="/roadmap" element={<Roadmap />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/github-insights" element={<GitHubInsights />} />
                        <Route path="/showcase" element={<Showcase />} />
                        <Route path="/system-info" element={<SystemInfo />} />
                    </Route>

                    {/* Preview Landing Page (for testing while signed in) */}
                    <Route path="/preview-landing" element={<Landing />} />

                    {/* Mobile Auth Page - for Flutter app authentication */}
                    <Route path="/mobile-auth" element={<MobileAuth />} />

                    {/* Catch all - 404 Not Found */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </CacheProvider>
        </ReactLenis>
    )
}

export default App

