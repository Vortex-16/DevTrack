import { useUser } from '@clerk/clerk-react';
import { useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { authApi } from '../services/api';

export function useGitHubScopes() {
    const { user, isLoaded } = useUser();
    const { isSignedIn } = useAuth();
    const [serverHasAccess, setServerHasAccess] = useState(false);
    const [serverChecked, setServerChecked] = useState(false);

    const getClerkRepoScopeState = () => {
        if (!isLoaded || !user) return 'unknown';

        const githubAccount = user.externalAccounts?.find(
            (acc) => acc.provider === 'github' || acc.provider === 'oauth_github'
        );

        if (!githubAccount) return 'none';

        const approvedScopes = githubAccount.approvedScopes || '';
        if (Array.isArray(approvedScopes)) {
            if (approvedScopes.length === 0) return 'unknown';
            return approvedScopes.includes('repo') ? 'granted' : 'missing';
        }
        if (typeof approvedScopes === 'string') {
            const scopes = approvedScopes.split(/\s+/).filter(Boolean);
            if (scopes.length === 0) return 'unknown';
            return scopes.includes('repo') ? 'granted' : 'missing';
        }
        return 'unknown';
    };

    // Check if the user has the 'repo' scope granted
    const hasRepoAccess = () => {
        const scopeState = getClerkRepoScopeState();
        if (serverHasAccess) return true;
        return scopeState === 'granted';
    };

    useEffect(() => {
        const checkServerAccess = async () => {
            if (!isLoaded || !isSignedIn) {
                setServerHasAccess(false);
                setServerChecked(true);
                return;
            }

            try {
                const response = await authApi.getMe();
                const userData = response?.data?.user || {};
                const hasToken = typeof userData.githubAccessActive === 'boolean'
                    ? userData.githubAccessActive
                    : !!userData.githubAccessToken;
                const expiresAt = userData.githubAccessExpiresAt ? new Date(userData.githubAccessExpiresAt) : null;
                const isValid = !expiresAt || Number.isNaN(expiresAt.getTime()) || expiresAt > new Date();

                setServerHasAccess(hasToken && isValid);
            } catch {
                setServerHasAccess(false);
            } finally {
                setServerChecked(true);
            }
        };

        checkServerAccess();
    }, [isLoaded, isSignedIn, user?.id]);

    // Request elevated 'repo' access
    const addRenewFlag = (url) => {
        try {
            const parsed = new URL(url, window.location.origin);
            parsed.searchParams.set('gh_access_renew', '1');
            return parsed.toString();
        } catch {
            return url;
        }
    };

    const requestRepoAccess = async (redirectUrl = window.location.href) => {
        if (!isLoaded || !user) return;

        const githubAccount = user.externalAccounts?.find(
            (acc) => acc.provider === 'github' || acc.provider === 'oauth_github'
        );

        if (githubAccount) {
            try {
                // Return the response for manual redirect processing
                const response = await githubAccount.reauthorize({
                    additionalScopes: ['repo'],
                    redirectUrl: addRenewFlag(redirectUrl)
                });

                if (response?.verification?.externalVerificationRedirectURL) {
                    window.location.href = response.verification.externalVerificationRedirectURL.href || response.verification.externalVerificationRedirectURL;
                    // Note: window.location.href redirect will unload the page, so no state updates are needed after
                }
            } catch (error) {
                console.error("Failed to reauthorize GitHub account:", error);
                throw error;
            }
        } else {
            console.error("No GitHub account found to reauthorize");
            throw new Error("No GitHub account found");
        }
    };

    return { hasRepoAccess: hasRepoAccess(), requestRepoAccess, isLoaded: isLoaded && serverChecked };
}
