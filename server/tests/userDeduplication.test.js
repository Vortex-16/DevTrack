const test = require('node:test');
const assert = require('node:assert/strict');
const { UserEntity, UserManager } = require('../src/services/userService');
const { TIERS } = require('../src/config/constants');

test('UserEntity: Normalization and Pro tier verification', () => {
    const user = new UserEntity({
        email: '  Alice@DevTrack.App  ',
        githubUsername: '  AliceDev  ',
        tier: TIERS.PRO,
    }, 'user_123');

    assert.equal(user.normalizedEmail, 'alice@devtrack.app');
    assert.equal(user.normalizedGithubUsername, 'alicedev');
    assert.equal(user.isPro, true);
});

test('UserEntity.mergeWith: Merges duplicate into canonical preserving Pro tier and earliest createdAt', () => {
    const canonical = new UserEntity({
        clerkId: 'user_active_clerk',
        email: 'alice@example.com',
        tier: TIERS.FREE,
        createdAt: '2026-05-01T00:00:00.000Z',
        grantedGithubScopes: ['read:user'],
        notifications: [{ id: 'notif_1', text: 'Welcome' }],
    }, 'user_active_clerk');

    const duplicate = new UserEntity({
        clerkId: 'user_old_clerk',
        email: 'alice@example.com',
        tier: TIERS.PRO, // Higher tier in old account
        stripeCustomerId: 'cus_stripe_alice',
        createdAt: '2025-01-01T00:00:00.000Z', // Earlier account creation
        grantedGithubScopes: ['repo', 'read:user'],
        notifications: [{ id: 'notif_1', text: 'Welcome' }, { id: 'notif_2', text: 'Milestone reached' }],
    }, 'user_old_clerk');

    const merged = canonical.mergeWith(duplicate);

    assert.equal(merged.id, 'user_active_clerk', 'Should preserve canonical ID');
    assert.equal(merged.tier, TIERS.PRO, 'Merged tier should be PRO (highest wins)');
    assert.equal(merged.stripeCustomerId, 'cus_stripe_alice', 'Should preserve stripe customer ID');
    assert.equal(merged.createdAt, '2025-01-01T00:00:00.000Z', 'Should preserve earliest creation date');

    // Scopes merged uniquely
    assert.ok(merged.grantedGithubScopes.includes('repo'));
    assert.ok(merged.grantedGithubScopes.includes('read:user'));
    assert.equal(merged.grantedGithubScopes.length, 2);

    // Notifications deduplicated
    assert.equal(merged.notifications.length, 2);
});

test('UserManager: Identifies duplicate user clusters by email and GitHub username', async () => {
    const mockDB = {
        users: {
            'user_clerk_1': {
                clerkId: 'user_clerk_1',
                email: 'bob@example.com',
                githubUsername: 'bob-code',
                tier: TIERS.PRO,
                updatedAt: '2026-10-01T00:00:00.000Z',
            },
            'user_legacy_2': {
                clerkId: 'user_legacy_2',
                email: 'BOB@EXAMPLE.COM', // Same email, different case
                githubUsername: 'bob-old',
                tier: TIERS.FREE,
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
            'user_standalone': {
                clerkId: 'user_standalone',
                email: 'charlie@example.com',
                githubUsername: 'charlie-dev',
                tier: TIERS.FREE,
            },
        },
    };

    const manager = new UserManager();

    // Mock getAllUsers
    manager.getAllUsers = async () => {
        return Object.entries(mockDB.users).map(([id, data]) => new UserEntity(data, id));
    };

    const clusters = await manager.findDuplicates();

    assert.equal(clusters.length, 1, 'Should find exactly 1 duplicate cluster');
    assert.equal(clusters[0].canonical.id, 'user_clerk_1', 'Canonical should be Pro tier with latest update');
    assert.equal(clusters[0].duplicates[0].id, 'user_legacy_2', 'Duplicate should be legacy user 2');
});

test('UserManager.mergeUserRecords: Migrates child collections and deletes duplicate user', async () => {
    const inMemoryData = {
        users: {
            'user_target': {
                clerkId: 'user_target',
                email: 'david@example.com',
                tier: TIERS.FREE,
            },
            'user_source': {
                clerkId: 'user_source',
                email: 'david@example.com',
                tier: TIERS.PRO,
            },
        },
        logs: {
            'log_1': { uid: 'user_source', title: 'Deep Work Session' },
            'log_2': { uid: 'user_target', title: 'Target Log' },
        },
        projects: {
            'proj_1': { uid: 'user_source', name: 'AI Scanner' },
        },
    };

    // Mock collections & batch
    const batchOps = [];
    const mockBatch = {
        update(ref, data) {
            batchOps.push({ type: 'update', ref, data });
        },
        set(ref, data, opts) {
            batchOps.push({ type: 'set', ref, data, opts });
        },
        delete(ref) {
            batchOps.push({ type: 'delete', ref });
        },
        async commit() {
            // Apply in-memory
            for (const op of batchOps) {
                if (op.type === 'delete') {
                    delete inMemoryData.users[op.ref.id];
                } else if (op.type === 'set') {
                    inMemoryData.users[op.ref.id] = { ...inMemoryData.users[op.ref.id], ...op.data };
                } else if (op.type === 'update') {
                    if (op.ref.collection === 'logs') {
                        inMemoryData.logs[op.ref.id] = { ...inMemoryData.logs[op.ref.id], ...op.data };
                    }
                    if (op.ref.collection === 'projects') {
                        inMemoryData.projects[op.ref.id] = { ...inMemoryData.projects[op.ref.id], ...op.data };
                    }
                }
            }
        },
    };

    const mockDb = {
        batch: () => mockBatch,
    };

    const mockCollections = {
        users: () => ({
            doc: (id) => ({ id, collection: 'users' }),
        }),
        logs: () => ({
            where: (field, op, val) => ({
                get: async () => Object.entries(inMemoryData.logs)
                    .filter(([_, item]) => item[field] === val)
                    .map(([id]) => ({ ref: { id, collection: 'logs' } })),
            }),
        }),
        projects: () => ({
            where: (field, op, val) => ({
                get: async () => Object.entries(inMemoryData.projects)
                    .filter(([_, item]) => item[field] === val)
                    .map(([id]) => ({ ref: { id, collection: 'projects' } })),
            }),
        }),
        tasks: () => ({ where: () => ({ get: async () => [] }) }),
        bookmarks: () => ({ where: () => ({ get: async () => [] }) }),
        resumes: () => ({ where: () => ({ get: async () => [] }) }),
        goals: () => ({ where: () => ({ get: async () => [] }) }),
        reports: () => ({ where: () => ({ get: async () => [] }) }),
        showcases: () => ({ where: () => ({ get: async () => [] }) }),
    };

    const manager = new UserManager(mockCollections, mockDb);

    // Mock user retrieval
    manager.getUserById = async (id) => {
        if (!inMemoryData.users[id]) return null;
        return new UserEntity(inMemoryData.users[id], id);
    };

    const result = await manager.mergeUserRecords('user_target', 'user_source');

    assert.equal(result.success, true);
    assert.equal(result.migratedCounts.logs, 1, 'Log from user_source should be migrated');
    assert.equal(result.migratedCounts.projects, 1, 'Project from user_source should be migrated');

    // Check merged user tier is PRO
    assert.equal(inMemoryData.users['user_target'].tier, TIERS.PRO);
    // Duplicate user should be deleted
    assert.equal(inMemoryData.users['user_source'], undefined);
    // Log uid should now point to user_target
    assert.equal(inMemoryData.logs['log_1'].uid, 'user_target');
    // Project uid should now point to user_target
    assert.equal(inMemoryData.projects['proj_1'].uid, 'user_target');
});
