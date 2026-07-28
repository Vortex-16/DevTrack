/**
 * Payment Service (Stripe Integration)
 * ═══════════════════════════════════════════════════════════════════════════
 * Handles subscription creation, customer portal management, and webhooks
 * with support for localized geo-pricing (INR for India, USD internationally).
 *
 * Architecture & Data Flow:
 *   1. User clicks "Upgrade to Pro" -> Client calls POST /api/payments/create-checkout-session
 *   2. Server constructs Stripe Checkout Session with localized Price ID -> Returns checkout URL
 *   3. User completes payment on Stripe hosted checkout page
 *   4. Stripe sends asynchronous webhook (checkout.session.completed) to POST /api/payments/webhook
 *   5. Server verifies webhook signature -> Updates user document in Firestore (tier: 'pro')
 *      and logs subscription record in subscriptions/{userId}
 *   6. User accesses Pro features immediately with 0 latency
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { collections } = require('../config/firebase');
const { TIERS, STRIPE } = require('../config/constants');
const logger = require('../utils/logger');

// Lazy-loaded Stripe instance to ensure clean boot if key is missing in dev
let _stripe = null;

function getStripe() {
    if (_stripe) return _stripe;
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        logger.warn('STRIPE_SECRET_KEY is not configured in environment variables');
        return null;
    }
    const Stripe = require('stripe');
    _stripe = new Stripe(secretKey, {
        apiVersion: '2023-10-16',
    });
    return _stripe;
}

class PaymentService {
    /**
     * Create a Stripe Checkout Session for subscription upgrade.
     * Selects price ID dynamically based on user's locale/country.
     *
     * @param {string} userId - User's Clerk ID
     * @param {string} userEmail - User's email
     * @param {string} [countryCode='IN'] - Country code (e.g. 'IN', 'US')
     * @param {string} [returnUrl] - Optional custom return URL base
     * @returns {Promise<{ checkoutUrl: string, sessionId: string }>}
     */
    async createCheckoutSession(userId, userEmail, countryCode = 'IN', returnUrl = null) {
        const stripe = getStripe();
        if (!stripe) {
            throw new Error('Stripe is not configured on the server');
        }

        // Determine pricing based on country (Geo-pricing: INR for IN, USD for international)
        const isIndia = (countryCode || '').toUpperCase() === 'IN';
        const priceId = isIndia
            ? (process.env.STRIPE_PRICE_ID_INR || 'price_pro_inr_mock')
            : (process.env.STRIPE_PRICE_ID_USD || 'price_pro_usd_mock');

        const baseUrl = returnUrl || process.env.CLIENT_URL || 'http://localhost:5173';

        // Check if user already has a Stripe Customer ID stored in Firestore
        const userDoc = await collections.users().doc(userId).get();
        let stripeCustomerId = userDoc.exists ? userDoc.data()?.stripeCustomerId : null;

        if (!stripeCustomerId) {
            // Create a new customer in Stripe
            const customer = await stripe.customers.create({
                email: userEmail,
                metadata: {
                    userId,
                },
            });
            stripeCustomerId = customer.id;

            // Save customer ID back to user document
            await collections.users().doc(userId).set({
                stripeCustomerId,
            }, { merge: true });
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            client_reference_id: userId,
            metadata: {
                userId,
                tier: TIERS.PRO,
            },
            success_url: `${baseUrl}${STRIPE.CHECKOUT_SUCCESS_PATH}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}${STRIPE.CHECKOUT_CANCEL_PATH}`,
            allow_promotion_codes: true,
            subscription_data: {
                metadata: {
                    userId,
                },
            },
        });

        logger.info('Stripe checkout session created', {
            userId,
            sessionId: session.id,
            isIndia,
            priceId,
        });

        return {
            checkoutUrl: session.url,
            sessionId: session.id,
        };
    }

    /**
     * Create a Stripe Customer Portal session for subscription management
     * (view invoices, update payment method, cancel subscription).
     *
     * @param {string} userId - User's Clerk ID
     * @param {string} [returnUrl] - Return URL after exiting portal
     * @returns {Promise<{ portalUrl: string }>}
     */
    async createPortalSession(userId, returnUrl = null) {
        const stripe = getStripe();
        if (!stripe) {
            throw new Error('Stripe is not configured on the server');
        }

        const userDoc = await collections.users().doc(userId).get();
        const stripeCustomerId = userDoc.exists ? userDoc.data()?.stripeCustomerId : null;

        if (!stripeCustomerId) {
            throw new Error('No subscription or billing profile found for this user');
        }

        const baseUrl = returnUrl || process.env.CLIENT_URL || 'http://localhost:5173';

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: `${baseUrl}/settings`,
        });

        return {
            portalUrl: portalSession.url,
        };
    }

    /**
     * Process Stripe webhook events securely.
     *
     * @param {Buffer|string} payload - Raw request body
     * @param {string} signature - Stripe signature header (stripe-signature)
     * @returns {Promise<{ processed: boolean, eventType: string }>}
     */
    async handleWebhook(payload, signature) {
        const stripe = getStripe();
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!stripe || !webhookSecret) {
            logger.error('Webhook failed: Stripe or STRIPE_WEBHOOK_SECRET missing');
            throw new Error('Stripe webhook configuration incomplete');
        }

        let event;
        try {
            event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        } catch (err) {
            logger.error('Stripe webhook signature verification failed', { error: err.message });
            throw new Error(`Webhook Signature Verification Failed: ${err.message}`);
        }

        logger.info(`Received Stripe webhook event: ${event.type}`, { eventId: event.id });

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                await this._handleCheckoutCompleted(session);
                break;
            }

            case 'customer.subscription.updated': {
                const subscription = event.data.object;
                await this._handleSubscriptionUpdated(subscription);
                break;
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object;
                await this._handleSubscriptionCancelled(subscription);
                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                await this._handleInvoicePaymentSucceeded(invoice);
                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                await this._handleInvoicePaymentFailed(invoice);
                break;
            }

            default:
                logger.debug(`Unhandled Stripe event type: ${event.type}`);
        }

        return { processed: true, eventType: event.type };
    }

    /**
     * Cancel subscription directly via API.
     *
     * @param {string} userId
     * @returns {Promise<{ success: boolean, message: string }>}
     */
    async cancelSubscription(userId) {
        const userDoc = await collections.users().doc(userId).get();
        if (!userDoc.exists) {
            throw new Error('User not found');
        }

        const stripeCustomerId = userDoc.data()?.stripeCustomerId;
        const stripe = getStripe();

        if (stripe && stripeCustomerId) {
            try {
                const subscriptions = await stripe.subscriptions.list({
                    customer: stripeCustomerId,
                    status: 'active',
                    limit: 1,
                });

                if (subscriptions.data.length > 0) {
                    await stripe.subscriptions.cancel(subscriptions.data[0].id);
                }
            } catch (err) {
                logger.warn('Stripe subscription cancellation warning', { userId, error: err.message });
            }
        }

        // Downgrade in Firestore
        await collections.users().doc(userId).update({
            tier: TIERS.FREE,
            tierExpiresAt: null,
            updatedAt: new Date().toISOString(),
        });

        // Invalidate cached tier in Redis/node-cache
        const cache = require('../config/cache');
        cache.del(`tier:${userId}`);

        return {
            success: true,
            message: 'Subscription cancelled successfully. Account downgraded to Free tier.',
        };
    }

    /**
     * Get user's current subscription status and billing metadata.
     *
     * @param {string} userId
     * @returns {Promise<object>}
     */
    async getSubscriptionStatus(userId) {
        const userDoc = await collections.users().doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};

        const subDoc = await collections.subscriptions().doc(userId).get();
        const subData = subDoc.exists ? subDoc.data() : null;

        return {
            tier: userData.tier || TIERS.FREE,
            tierExpiresAt: userData.tierExpiresAt || null,
            stripeCustomerId: userData.stripeCustomerId || null,
            subscription: subData,
        };
    }

    // ─── Private Event Handlers ───────────────────────────────────────────────

    async _handleCheckoutCompleted(session) {
        const userId = session.client_reference_id || session.metadata?.userId;
        if (!userId) {
            logger.error('Checkout completed webhook missing client_reference_id / userId', { session });
            return;
        }

        const subscriptionId = session.subscription;
        const customerId = session.customer;

        logger.info('Upgrading user to Pro tier following checkout', { userId, subscriptionId });

        // Update User document
        await collections.users().doc(userId).set({
            tier: TIERS.PRO,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            tierUpgradedAt: new Date().toISOString(),
        }, { merge: true });

        // Record in subscriptions collection
        await collections.subscriptions().doc(userId).set({
            userId,
            tier: TIERS.PRO,
            status: 'active',
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        // Log payment record
        await collections.payments().doc(session.id).set({
            userId,
            sessionId: session.id,
            amountTotal: session.amount_total,
            currency: session.currency,
            paymentStatus: session.payment_status,
            createdAt: new Date().toISOString(),
        });

        // Invalidate tier cache
        const cache = require('../config/cache');
        cache.del(`tier:${userId}`);
    }

    async _handleSubscriptionUpdated(subscription) {
        const userId = subscription.metadata?.userId;
        if (!userId) return;

        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const newTier = isActive ? TIERS.PRO : TIERS.FREE;

        await collections.users().doc(userId).set({
            tier: newTier,
            stripeSubscriptionStatus: subscription.status,
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        await collections.subscriptions().doc(userId).set({
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        const cache = require('../config/cache');
        cache.del(`tier:${userId}`);
    }

    async _handleSubscriptionCancelled(subscription) {
        const userId = subscription.metadata?.userId;
        if (!userId) return;

        logger.info('Subscription cancelled, downgrading user to Free', { userId });

        await collections.users().doc(userId).set({
            tier: TIERS.FREE,
            stripeSubscriptionStatus: 'canceled',
            tierDowngradedAt: new Date().toISOString(),
        }, { merge: true });

        await collections.subscriptions().doc(userId).set({
            status: 'canceled',
            cancelledAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }, { merge: true });

        const cache = require('../config/cache');
        cache.del(`tier:${userId}`);
    }

    async _handleInvoicePaymentSucceeded(invoice) {
        logger.info('Invoice payment succeeded', { invoiceId: invoice.id, customer: invoice.customer });
    }

    async _handleInvoicePaymentFailed(invoice) {
        logger.warn('Invoice payment failed', { invoiceId: invoice.id, customer: invoice.customer });
    }
}

module.exports = new PaymentService();
