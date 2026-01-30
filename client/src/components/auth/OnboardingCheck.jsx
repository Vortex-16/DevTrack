import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { preferencesApi } from '../../services/api';
import ProfessionalLoader from '../ui/ProfessionalLoader';

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
        if (!isLoaded || !isSignedIn || location.pathname === '/onboarding') {
            setChecked(true);
            return;
        }
        setChecked(true);
    }, [isSignedIn, isLoaded, location.pathname]);

    if (!checked && isSignedIn) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <ProfessionalLoader size="lg" />
            </div>
        );
    }

    return children;
};

export default OnboardingCheck;

