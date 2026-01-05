import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key")
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ClerkProvider
            publishableKey={PUBLISHABLE_KEY}
            appearance={{
                baseTheme: undefined,
                variables: {
                    colorBackground: '#0f172a',
                    colorInputBackground: '#1e293b',
                    colorInputText: '#f1f5f9',
                    colorText: '#f1f5f9',
                    colorTextSecondary: '#94a3b8',
                    colorPrimary: '#a855f7',
                    colorDanger: '#ef4444',
                    colorSuccess: '#22c55e',
                    colorWarning: '#f59e0b',
                    colorNeutral: '#64748b',
                    borderRadius: '0.75rem',
                },
                elements: {
                    card: 'bg-slate-900 border border-slate-800',
                    headerTitle: 'text-white',
                    headerSubtitle: 'text-slate-400',
                    socialButtonsBlockButton: 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700',
                    formFieldLabel: 'text-slate-300',
                    formFieldInput: 'bg-slate-800 border-slate-700 text-white',
                    footerActionLink: 'text-purple-400 hover:text-purple-300',
                    identityPreviewText: 'text-white',
                    identityPreviewEditButton: 'text-purple-400',
                }
            }}
        >
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <App />
            </BrowserRouter>
        </ClerkProvider>
    </React.StrictMode>,
)
