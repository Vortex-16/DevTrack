/**
 * Payment API Service
 * Client-side integration for Stripe payments, subscription status, and usage analytics.
 */

import api from './api';

export const paymentApi = {
    /**
     * Create a Stripe Checkout Session and return the URL.
     * @param {object} params - { email, countryCode, returnUrl }
     */
    async createCheckoutSession(params = {}) {
        const response = await api.post('/payments/create-checkout-session', params);
        return response.data;
    },

    /**
     * Create a Stripe Customer Portal session.
     * @param {string} [returnUrl]
     */
    async createPortalSession(returnUrl) {
        const response = await api.post('/payments/create-portal-session', { returnUrl });
        return response.data;
    },

    /**
     * Get user's current subscription & tier status.
     */
    async getStatus() {
        const response = await api.get('/payments/status');
        return response.data;
    },

    /**
     * Get user's feature usage summary.
     */
    async getUsage() {
        const response = await api.get('/payments/usage');
        return response.data;
    },

    /**
     * Cancel user's active subscription.
     */
    async cancelSubscription() {
        const response = await api.post('/payments/cancel');
        return response.data;
    },
};

export default paymentApi;
