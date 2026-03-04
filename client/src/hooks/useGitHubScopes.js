import { useUser } from '@clerk/clerk-react';

export function useGitHubScopes() {
    const { user, isLoaded } = useUser();

    // Check if the user has the 'repo' scope granted
    const hasRepoAccess = () => {
        if (!isLoaded || !user) return false;

        const githubAccount = user.externalAccounts?.find(
            (acc) => acc.provider === 'github' || acc.provider === 'oauth_github'
        );

        if (!githubAccount) return false;

        // Clerk's externalAccounts store approvedScopes as a string (e.g., "repo read:user user:email")
        const approvedScopes = githubAccount.approvedScopes || '';
        return approvedScopes.includes('repo');
    };

    // Request elevated 'repo' access
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
                    redirectUrl
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

    return { hasRepoAccess: hasRepoAccess(), requestRepoAccess, isLoaded };
}
