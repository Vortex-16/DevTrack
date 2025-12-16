import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { preferencesApi } from '../../services/api';

/**
 * OnboardingCheck Component
 * Fallback safety net - primary onboarding redirect is in App.jsx
 * This component is kept for backward compatibility and edge cases
 */
const OnboardingCheck = ({ children }) => {
    const { isSignedIn, isLoaded } = useUser();
    const navigate = useNavigate();
    const location = useLocation();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        // Skip check - primary redirect is now in App.jsx
        // This is just a minimal fallback
        if (!isLoaded || !isSignedIn || location.pathname === '/onboarding') {
            setChecked(true);
            return;
        }
        setChecked(true);
    }, [isSignedIn, isLoaded, location.pathname]);

    if (!checked && isSignedIn) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return children;
};

export default OnboardingCheck;

