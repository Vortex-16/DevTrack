import { useEffect } from 'react';
import { healthApi } from '../services/api';

/**
 * Hook to periodically ping the backend to keep it alive
 * Prevents Render's free tier from spinning down
 */
const useHeartbeat = (intervalMs = 5 * 60 * 1000) => {
    useEffect(() => {
        const ping = async () => {
            try {
                await healthApi.check();
                console.log('💓 Heartbeat: Backend is alive');
            } catch (error) {
                console.warn('💓 Heartbeat: Failed to ping backend', error.message);
            }
        };

        // Ping immediately on mount
        ping();

        const interval = setInterval(ping, intervalMs);
        return () => clearInterval(interval);
    }, [intervalMs]);
};

export default useHeartbeat;
