import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import paymentApi from '../services/paymentApi';

const SubscriptionContext = createContext(null);

export const SubscriptionProvider = ({ children }) => {
    const [tier, setTier] = useState('free');
    const [usage, setUsage] = useState({});
    const [loading, setLoading] = useState(true);
    const { isSignedIn, userId } = useAuth();
    const [promptState, setPromptState] = useState({
        open: false,
        action: null,
        details: null,
    });

    const refreshUsage = useCallback(async () => {
        try {
            const data = await paymentApi.getUsage();
            if (data?.success && data?.data) {
                setTier(data.data.tier || 'free');
                setUsage(data.data.usage || {});
            }
        } catch (error) {
            console.error('Failed to load usage summary:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isSignedIn) {
            refreshUsage();
        } else {
            setTier('free');
            setUsage({});
            setLoading(false);
        }

        // Listen for global 429 (quota exceeded) events dispatched by axios interceptor
        const handleQuotaExceeded = (event) => {
            const { action, details } = event.detail || {};
            setPromptState({
                open: true,
                action: action || 'Quota Exceeded',
                details: details || null,
            });
        };

        window.addEventListener('devtrack:quota_exceeded', handleQuotaExceeded);
        return () => {
            window.removeEventListener('devtrack:quota_exceeded', handleQuotaExceeded);
        };
    }, [isSignedIn, userId, refreshUsage]);

    const canUse = useCallback(
        (action) => {
            if (tier === 'pro' || tier === 'enterprise') return true;
            const item = usage[action];
            if (!item) return true;
            if (item.limit === Infinity) return true;
            return item.used < item.limit;
        },
        [tier, usage]
    );

    const remaining = useCallback(
        (action) => {
            const item = usage[action];
            if (!item) return Infinity;
            return item.remaining !== undefined ? item.remaining : Infinity;
        },
        [usage]
    );

    const closePrompt = () => {
        setPromptState((prev) => ({ ...prev, open: false }));
    };

    const triggerUpgradePrompt = (action, details = null) => {
        setPromptState({ open: true, action, details });
    };

    const value = {
        tier,
        usage,
        loading,
        isPro: tier === 'pro' || tier === 'enterprise',
        isFree: tier === 'free',
        canUse,
        remaining,
        refreshUsage,
        promptState,
        closePrompt,
        triggerUpgradePrompt,
    };

    return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};

export default useSubscription;
