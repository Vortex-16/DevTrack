import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut } from "@clerk/clerk-react"
import AppLayout from './components/layout/AppLayout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Learning from './pages/Learning'
import Projects from './pages/Projects'
import Chat from './pages/Chat'

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={
                <>
                    <SignedOut>
                        <Landing />
                    </SignedOut>
                    <SignedIn>
                        <Navigate to="/dashboard" replace />
                    </SignedIn>
                </>
            } />

            {/* Protected Routes */}
            <Route element={
                <SignedIn>
                    <AppLayout />
                </SignedIn>
            }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/learning" element={<Learning />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/chat" element={<Chat />} />
            </Route>

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}

export default App
