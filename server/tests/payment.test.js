const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const paymentController = require('../src/controllers/paymentController');
const paymentService = require('../src/services/paymentService');
const { TIERS, STRIPE } = require('../src/config/constants');

test('Payment routes and webhook are mounted correctly', () => {
    // 1. Verify webhook route is registered on app
    const webhookRoute = app._router.stack.find(
        (layer) => layer.route && layer.route.path === '/api/payments/webhook'
    );
    assert.ok(webhookRoute, 'Stripe webhook route should be registered on app');
    assert.equal(webhookRoute.route.methods.post, true);

    // 2. Verify payments router prefix is mounted
    const paymentsMount = app._router.stack.find(
        (layer) => layer.regexp && layer.regexp.test('/api/payments')
    );
    assert.ok(paymentsMount, '/api/payments router should be mounted');
});

test('paymentController.verifyCheckoutSession rejects unauthenticated calls', async () => {
    let capturedError = null;
    const mockReq = {
        auth: {}, // missing userId
        body: { sessionId: 'cs_test_123' },
    };
    const mockRes = {
        status() { return this; },
        json() { return this; },
    };
    const mockNext = (err) => {
        capturedError = err;
    };

    await paymentController.verifyCheckoutSession(mockReq, mockRes, mockNext);

    assert.ok(capturedError, 'Should pass error to next()');
    assert.equal(capturedError.statusCode, 401);
});

test('paymentController.verifyCheckoutSession rejects missing sessionId', async () => {
    let capturedError = null;
    const mockReq = {
        auth: { userId: 'user_test_123' },
        body: {}, // missing sessionId
    };
    const mockRes = {
        status() { return this; },
        json() { return this; },
    };
    const mockNext = (err) => {
        capturedError = err;
    };

    await paymentController.verifyCheckoutSession(mockReq, mockRes, mockNext);

    assert.ok(capturedError, 'Should pass ValidationError to next()');
    assert.equal(capturedError.statusCode, 400);
});

test('paymentController.handleWebhook rejects requests without stripe-signature header', async () => {
    const mockReq = {
        headers: {}, // missing stripe-signature
        body: Buffer.from(JSON.stringify({ type: 'test' })),
    };
    let responseStatus = null;
    let responseBody = null;
    const mockRes = {
        status(code) {
            responseStatus = code;
            return this;
        },
        send(msg) {
            responseBody = msg;
            return this;
        },
        json(data) {
            responseBody = data;
            return this;
        },
    };
    const mockNext = () => {};

    await paymentController.handleWebhook(mockReq, mockRes, mockNext);

    assert.equal(responseStatus, 400);
    assert.ok(String(responseBody).includes('Missing stripe-signature header'));
});

test('PaymentService: _handleCheckoutCompleted upgrades tier and stores payment records', async () => {
    // In-memory mock database store
    const inMemoryDB = {
        users: {},
        subscriptions: {},
        payments: {},
    };

    const mockFirebase = {
        users: () => ({
            doc: (id) => ({
                get: async () => ({
                    exists: !!inMemoryDB.users[id],
                    data: () => inMemoryDB.users[id] || {},
                }),
                set: async (data, opts) => {
                    inMemoryDB.users[id] = opts?.merge
                        ? { ...inMemoryDB.users[id], ...data }
                        : data;
                },
                update: async (data) => {
                    inMemoryDB.users[id] = { ...inMemoryDB.users[id], ...data };
                },
            }),
        }),
        subscriptions: () => ({
            doc: (id) => ({
                set: async (data, opts) => {
                    inMemoryDB.subscriptions[id] = opts?.merge
                        ? { ...inMemoryDB.subscriptions[id], ...data }
                        : data;
                },
            }),
        }),
        payments: () => ({
            doc: (id) => ({
                set: async (data) => {
                    inMemoryDB.payments[id] = data;
                },
            }),
        }),
    };

    // Temporarily point paymentService collections to mock
    const originalCollections = require('../src/config/firebase').collections;
    const firebaseModule = require('../src/config/firebase');
    const origUsers = firebaseModule.collections.users;
    const origSubs = firebaseModule.collections.subscriptions;
    const origPayments = firebaseModule.collections.payments;

    firebaseModule.collections.users = mockFirebase.users;
    firebaseModule.collections.subscriptions = mockFirebase.subscriptions;
    firebaseModule.collections.payments = mockFirebase.payments;

    try {
        const testUserId = 'user_monetization_test_42';
        const testSessionId = 'cs_test_success_999';
        const testSubId = 'sub_stripe_active_123';
        const testCustId = 'cus_stripe_customer_456';

        const mockSession = {
            id: testSessionId,
            client_reference_id: testUserId,
            subscription: testSubId,
            customer: testCustId,
            amount_total: 19900,
            currency: 'inr',
            payment_status: 'paid',
        };

        await paymentService._handleCheckoutCompleted(mockSession);

        // Verify user tier is PRO in Firestore
        const user = inMemoryDB.users[testUserId];
        assert.ok(user, 'User record should exist');
        assert.equal(user.tier, TIERS.PRO, 'User tier should be upgraded to pro');
        assert.equal(user.stripeCustomerId, testCustId);
        assert.equal(user.stripeSubscriptionId, testSubId);
        assert.ok(user.tierUpgradedAt, 'tierUpgradedAt timestamp should be set');

        // Verify subscription record
        const sub = inMemoryDB.subscriptions[testUserId];
        assert.ok(sub, 'Subscription record should exist');
        assert.equal(sub.tier, TIERS.PRO);
        assert.equal(sub.status, 'active');

        // Verify payment record
        const payment = inMemoryDB.payments[testSessionId];
        assert.ok(payment, 'Payment transaction record should exist');
        assert.equal(payment.userId, testUserId);
        assert.equal(payment.amountTotal, 19900);
        assert.equal(payment.currency, 'inr');
        assert.equal(payment.paymentStatus, 'paid');

    } finally {
        // Restore original collections
        firebaseModule.collections.users = origUsers;
        firebaseModule.collections.subscriptions = origSubs;
        firebaseModule.collections.payments = origPayments;
    }
});

test('PaymentService: _handleSubscriptionCancelled downgrades tier to FREE', async () => {
    const inMemoryDB = {
        users: {
            'user_cancel_test': { tier: TIERS.PRO, stripeCustomerId: 'cus_123' },
        },
        subscriptions: {},
    };

    const firebaseModule = require('../src/config/firebase');
    const origUsers = firebaseModule.collections.users;
    const origSubs = firebaseModule.collections.subscriptions;

    firebaseModule.collections.users = () => ({
        doc: (id) => ({
            set: async (data, opts) => {
                inMemoryDB.users[id] = opts?.merge ? { ...inMemoryDB.users[id], ...data } : data;
            },
        }),
    });
    firebaseModule.collections.subscriptions = () => ({
        doc: (id) => ({
            set: async (data, opts) => {
                inMemoryDB.subscriptions[id] = opts?.merge ? { ...inMemoryDB.subscriptions[id], ...data } : data;
            },
        }),
    });

    try {
        const mockSubscription = {
            id: 'sub_test_to_cancel',
            metadata: { userId: 'user_cancel_test' },
            status: 'canceled',
        };

        await paymentService._handleSubscriptionCancelled(mockSubscription);

        const user = inMemoryDB.users['user_cancel_test'];
        assert.equal(user.tier, TIERS.FREE, 'User tier should be downgraded to free');
        assert.equal(user.stripeSubscriptionStatus, 'canceled');
        assert.ok(user.tierDowngradedAt);
    } finally {
        firebaseModule.collections.users = origUsers;
        firebaseModule.collections.subscriptions = origSubs;
    }
});

test('Payment constants: Stripe pricing & intervals match spec', () => {
    assert.equal(STRIPE.PRICE_INR_AMOUNT, 19900, 'INR Pro price should be 19900 paise (₹199)');
    assert.equal(STRIPE.PRICE_USD_AMOUNT, 500, 'USD Pro price should be 500 cents ($5)');
    assert.equal(STRIPE.BILLING_INTERVAL, 'month');
    assert.equal(STRIPE.CHECKOUT_SUCCESS_PATH, '/dashboard?subscription=success');
    assert.equal(STRIPE.CHECKOUT_CANCEL_PATH, '/pricing?subscription=cancelled');
});
