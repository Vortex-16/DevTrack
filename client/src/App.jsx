import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, useUser } from "@clerk/clerk-react"
import { useEffect, useState } from 'react'
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Learning from './pages/Learning'
import Projects from './pages/Projects'
import Chat from './pages/Chat'
import SystemInfo from './pages/SystemInfo'
import Onboarding from './pages/Onboarding'
import { preferencesApi } from './services/api'
import useHeartbeat from './hooks/useHeartbeat'
import Lenis from 'lenis'
import { CacheProvider } from './context/CacheContext'

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
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
                    <p className="text-slate-400">Loading...</p>
                </div>
            </div>
        )
    }

    if (needsOnboarding) {
        return null
    }

    return children
}


function App() {
    useHeartbeat()

    useEffect(() => {
        const lenis = new Lenis()

        function raf(time) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

        return () => {
            lenis.destroy()
        }
    }, [])

    return (
        <CacheProvider>
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

                {/* Onboarding Route (Protected) */}
                <Route path="/onboarding" element={
                    <SignedIn>
                        <Onboarding />
                    </SignedIn>
                } />

                {/* Protected Routes */}
                <Route element={
                    <SignedIn>
                        <OnboardingRedirect>
                            <AppLayout />
                        </OnboardingRedirect>
                    </SignedIn>
                }>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/learning" element={<Learning />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/system-info" element={<SystemInfo />} />
                </Route>

                {/* Preview Landing Page (for testing while signed in) */}
                <Route path="/preview-landing" element={<Landing />} />

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </CacheProvider>
    )
}

export default App

