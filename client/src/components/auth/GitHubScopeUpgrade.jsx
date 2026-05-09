/**
 * GitHubScopeUpgrade — Smart scope escalation UI component
 *
 * Shown when a user tries to access a feature that requires the `repo` scope
 * (private repos, repo creation, README commits, traffic data) but only has
 * basic scopes (read:user, user:email).
 *
 * Strategy: Use Clerk's `useClerk()` to trigger a re-auth that redirects the
 * user back to GitHub OAuth with upgraded scopes. Clerk handles the OAuth
 * callback and merges the new token into the existing session.
 *
 * Usage:
 *   <GitHubScopeUpgrade
 *     feature="Private Repos"
 *     description="Access your private repositories and their analytics."
 *     onDismiss={() => setShowUpgrade(false)}
 *   />
 */

import { useState } from 'react';
import { useClerk } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Github, ArrowRight, X, Shield, Zap, Eye } from 'lucide-react';

const FEATURE_ICONS = {
    'private-repos': Eye,
    'repo-creation': Zap,
    'readme-commit': Shield,
    default: Lock,
};

const GitHubScopeUpgrade = ({
    feature = 'Private Repository Access',
    description = 'This feature requires additional GitHub permissions to access your private repositories.',
    requiredScopes = ['repo'],
    featureKey = 'default',
    onDismiss,
    compact = false,
}) => {
    const { openUserProfile, redirectToSignIn } = useClerk();
    const [isLoading, setIsLoading] = useState(false);

    const Icon = FEATURE_ICONS[featureKey] || FEATURE_ICONS.default;

    /**
     * Trigger GitHub re-auth with elevated scopes via Clerk.
     * Clerk will redirect to GitHub OAuth with the new scope list,
     * then redirect back to the current page with ?gh_access_renew=1
     * which BackgroundSync in App.jsx picks up and calls renewGithubAccess.
     */
    const handleUpgrade = async () => {
        setIsLoading(true);
        try {
            // Build return URL with gh_access_renew flag so BackgroundSync
            // knows to persist the upgraded token on return
            const returnUrl = `${window.location.pathname}${window.location.search}${window.location.search ? '&' : '?'}gh_access_renew=1`;

            // Clerk re-auth: this opens the Clerk OAuth flow.
            // The user will be prompted to re-authorize DevTrack on GitHub
            // with the expanded scope set configured in your Clerk Dashboard.
            //
            // IMPORTANT: To enable `repo` scope, go to:
            // Clerk Dashboard → User & Authentication → Social Connections
            // → GitHub → Scopes → add `repo`
            //
            // After re-auth, the user returns to DevTrack and BackgroundSync
            // calls POST /api/auth/renew-github-access which stores the new token.
            await redirectToSignIn({
                redirectUrl: returnUrl,
                afterSignInUrl: returnUrl,
            });
        } catch (err) {
            console.error('Scope upgrade failed:', err);
            setIsLoading(false);
        }
    };

    if (compact) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3"
            >
                <Lock className="h-4 w-4 flex-shrink-0 text-violet-400" />
                <p className="text-sm text-slate-300 flex-1">
                    <span className="font-medium text-violet-300">{feature}</span>
                    {' '}requires GitHub private access.
                </p>
                <button
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500 transition-colors disabled:opacity-60"
                >
                    {isLoading ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />
                    ) : (
                        <Github className="h-3 w-3" />
                    )}
                    Connect
                </button>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 16 }}
                transition={{ duration: 0.25 }}
                className="relative rounded-2xl border border-slate-700/60 bg-slate-900/80 backdrop-blur-sm p-6 shadow-2xl"
            >
                {/* Dismiss button */}
                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label="Dismiss"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                {/* Header */}
                <div className="flex items-start gap-4 mb-5">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/20 border border-violet-500/30">
                        <Icon className="h-6 w-6 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-white mb-1">
                            {feature} Requires GitHub Access
                        </h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                {/* What you'll unlock */}
                <div className="mb-5 rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                        What you'll unlock
                    </p>
                    {[
                        'View and analyze private repositories',
                        'Create repositories directly from DevTrack',
                        'Commit AI-generated READMEs to your repos',
                        'See clone and traffic data for all repos',
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2.5">
                            <div className="h-1.5 w-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                            <span className="text-sm text-slate-300">{item}</span>
                        </div>
                    ))}
                </div>

                {/* Required scopes badge */}
                <div className="mb-5 flex flex-wrap gap-2">
                    <span className="text-xs text-slate-500">Requires:</span>
                    {requiredScopes.map(scope => (
                        <span
                            key={scope}
                            className="rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300"
                        >
                            {scope}
                        </span>
                    ))}
                </div>

                {/* CTA */}
                <button
                    id="github-scope-upgrade-btn"
                    onClick={handleUpgrade}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 hover:from-violet-500 hover:to-violet-600 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed group"
                >
                    {isLoading ? (
                        <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Connecting to GitHub...
                        </>
                    ) : (
                        <>
                            <Github className="h-4 w-4" />
                            Connect GitHub Private Access
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                    )}
                </button>

                <p className="mt-3 text-center text-xs text-slate-600">
                    You'll be redirected to GitHub to grant permissions, then returned here.
                </p>
            </motion.div>
        </AnimatePresence>
    );
};

export default GitHubScopeUpgrade;
