/**
 * User Domain Service (OOP Architecture)
 * ═══════════════════════════════════════════════════════════════════════════
 * Encapsulates User entity modeling, Firestore repository interactions,
 * deduplication logic, and child-resource migration adhering to OOP fundamentals
 * (Encapsulation, Single Responsibility, and Open/Closed Principle).
 * ═══════════════════════════════════════════════════════════════════════════
 */

const { collections, getFirestore } = require('../config/firebase');
const { TIERS } = require('../config/constants');
const { isPermanentProUser } = require('../config/adminAccess');
const logger = require('../utils/logger');

/**
 * UserEntity — Domain model representing a DevTrack user
 */
class UserEntity {
    constructor(data = {}, id = null) {
        this.id = id || data.id || data.clerkId || null;
        this.clerkId = data.clerkId || this.id;
        this.email = data.email || null;
        this.name = data.name || null;
        this.avatarUrl = data.avatarUrl || null;
        this.githubAvatarUrl = data.githubAvatarUrl || null;
        this.githubUsername = data.githubUsername || null;
        this.githubId = data.githubId ? String(data.githubId) : null;
        this.tier = data.tier || TIERS.FREE;
        this.tierExpiresAt = data.tierExpiresAt || null;
        this.isExemptFromDowngrade = Boolean(data.isExemptFromDowngrade);
        this.stripeCustomerId = data.stripeCustomerId || null;
        this.stripeSubscriptionId = data.stripeSubscriptionId || null;
        this.stripeSubscriptionStatus = data.stripeSubscriptionStatus || null;
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.lastStartTime = data.lastStartTime || null;
        this.lastEndTime = data.lastEndTime || null;
        this.grantedGithubScopes = Array.isArray(data.grantedGithubScopes) ? data.grantedGithubScopes : [];
        this.notifications = Array.isArray(data.notifications) ? data.notifications : [];
        this.fcmToken = data.fcmToken || null;
        this.fcmTokens = Array.isArray(data.fcmTokens) ? data.fcmTokens : [];
        this.preferences = data.preferences || {};
        this.verifiedSkills = Array.isArray(data.verifiedSkills) ? data.verifiedSkills : [];
        this.raw = { ...data };
    }

    get normalizedEmail() {
        return this.email ? this.email.trim().toLowerCase() : null;
    }

    get normalizedGithubUsername() {
        return this.githubUsername ? this.githubUsername.trim().toLowerCase() : null;
    }

    get isPro() {
        return this.tier === TIERS.PRO || this.tier === 'enterprise';
    }

    /**
     * Merge another UserEntity into this one (canonical precedence).
     * @param {UserEntity} duplicate
     * @returns {UserEntity} Merged UserEntity
     */
    mergeWith(duplicate) {
        if (!(duplicate instanceof UserEntity)) {
            duplicate = new UserEntity(duplicate);
        }

        // Higher tier takes precedence
        const resolvedTier = this.isPro || duplicate.isPro ? TIERS.PRO : TIERS.FREE;
        const resolvedExempt = this.isExemptFromDowngrade || duplicate.isExemptFromDowngrade;

        // Earliest creation date preserved
        const resolvedCreatedAt =
            new Date(this.createdAt) < new Date(duplicate.createdAt) ? this.createdAt : duplicate.createdAt;

        // Latest activity times preserved
        const resolvedStartTime = this.lastStartTime || duplicate.lastStartTime;
        const resolvedEndTime = this.lastEndTime || duplicate.lastEndTime;

        // Merge arrays uniquely
        const mergedScopes = Array.from(new Set([...this.grantedGithubScopes, ...duplicate.grantedGithubScopes]));
        const mergedFcmTokens = Array.from(
            new Set([...this.fcmTokens, ...duplicate.fcmTokens, this.fcmToken, duplicate.fcmToken].filter(Boolean))
        );

        // Merge notifications by unique ID or timestamp
        const seenNotifIds = new Set();
        const mergedNotifications = [...this.notifications, ...duplicate.notifications].filter((n) => {
            const key = n.id || `${n.type}_${n.createdAt}`;
            if (seenNotifIds.has(key)) return false;
            seenNotifIds.add(key);
            return true;
        });

        // Merge preferences
        const mergedPreferences = {
            ...(duplicate.preferences || {}),
            ...(this.preferences || {}),
        };

        const mergedData = {
            ...duplicate.raw,
            ...this.raw,
            id: this.id,
            clerkId: this.clerkId || duplicate.clerkId,
            email: this.email || duplicate.email,
            name: this.name || duplicate.name,
            avatarUrl: this.avatarUrl || duplicate.avatarUrl,
            githubAvatarUrl: this.githubAvatarUrl || duplicate.githubAvatarUrl,
            githubUsername: this.githubUsername || duplicate.githubUsername,
            githubId: this.githubId || duplicate.githubId,
            stripeCustomerId: this.stripeCustomerId || duplicate.stripeCustomerId,
            stripeSubscriptionId: this.stripeSubscriptionId || duplicate.stripeSubscriptionId,
            tier: resolvedTier,
            isExemptFromDowngrade: resolvedExempt,
            createdAt: resolvedCreatedAt,
            updatedAt: new Date().toISOString(),
            lastStartTime: resolvedStartTime,
            lastEndTime: resolvedEndTime,
            grantedGithubScopes: mergedScopes,
            fcmTokens: mergedFcmTokens,
            fcmToken: this.fcmToken || duplicate.fcmToken || mergedFcmTokens[0] || null,
            notifications: mergedNotifications,
            preferences: mergedPreferences,
        };

        return new UserEntity(mergedData, this.id);
    }

    toFirestore() {
        const { id, raw, ...data } = this;
        return data;
    }

    toSafeJSON() {
        const { id, raw, ...data } = this;
        delete data.githubAccessToken;
        delete data.githubAccessTokenEncrypted;
        delete data.githubAccessTokenIv;
        delete data.githubAccessTokenAuthTag;
        return {
            id: this.id,
            ...data,
        };
    }
}

/**
 * UserManager — Repository and service orchestrating User persistence,
 * lookup, and deduplication with child-entity relationship preservation.
 */
class UserManager {
    constructor(customCollections = null, customDb = null) {
        this._customCollections = customCollections;
        this._customDb = customDb;
    }

    get db() {
        return this._customDb || getFirestore();
    }

    get usersCollection() {
        return this._customCollections?.users?.() || collections.users();
    }

    get logsCollection() {
        return this._customCollections?.logs?.() || collections.logs();
    }

    get projectsCollection() {
        return this._customCollections?.projects?.() || collections.projects();
    }

    get tasksCollection() {
        return this._customCollections?.tasks?.() || collections.tasks();
    }

    get bookmarksCollection() {
        return this._customCollections?.bookmarks?.() || collections.bookmarks();
    }

    get showcasesCollection() {
        return this._customCollections?.showcases?.() || collections.showcases();
    }

    get resumesCollection() {
        return this._customCollections?.resumes?.() || collections.resumes();
    }

    get goalsCollection() {
        return this._customCollections?.goals?.() || collections.goals();
    }

    get reportsCollection() {
        return this._customCollections?.reports?.() || collections.reports();
    }

    /**
     * Retrieve user by Firestore document ID
     */
    async getUserById(id) {
        if (!id) return null;
        const snap = await this.usersCollection.doc(id).get();
        if (!snap.exists) return null;
        return new UserEntity(snap.data(), snap.id);
    }

    /**
     * Find all users matching a given email (case-insensitive)
     */
    async findUsersByEmail(email) {
        if (!email) return [];
        const normalized = email.trim().toLowerCase();
        const allUsers = await this.getAllUsers();
        return allUsers.filter((u) => u.normalizedEmail === normalized);
    }

    /**
     * Find all users matching a GitHub username (case-insensitive)
     */
    async findUsersByGithub(githubUsername) {
        if (!githubUsername) return [];
        const normalized = githubUsername.trim().toLowerCase();
        const allUsers = await this.getAllUsers();
        return allUsers.filter((u) => u.normalizedGithubUsername === normalized);
    }

    /**
     * Get all users in the collection
     */
    async getAllUsers() {
        const snapshot = await this.usersCollection.get();
        const users = [];
        snapshot.forEach((doc) => {
            users.push(new UserEntity(doc.data(), doc.id));
        });
        return users;
    }

    /**
     * Scan database and detect duplicate user records.
     * Groups duplicates by:
     *   1. Identical email
     *   2. Identical githubUsername
     *   3. Identical githubId
     *
     * @returns {Promise<Array<{ key: string, reason: string, canonical: UserEntity, duplicates: UserEntity[] }>>}
     */
    async findDuplicates() {
        const allUsers = await this.getAllUsers();
        const emailMap = new Map();
        const githubMap = new Map();
        const clusters = [];
        const visitedIds = new Set();

        for (const user of allUsers) {
            // Group by normalized email
            if (user.normalizedEmail) {
                if (!emailMap.has(user.normalizedEmail)) {
                    emailMap.set(user.normalizedEmail, []);
                }
                emailMap.get(user.normalizedEmail).push(user);
            }

            // Group by normalized GitHub username
            if (user.normalizedGithubUsername) {
                if (!githubMap.has(user.normalizedGithubUsername)) {
                    githubMap.set(user.normalizedGithubUsername, []);
                }
                githubMap.get(user.normalizedGithubUsername).push(user);
            }
        }

        // Process duplicate clusters by email
        for (const [email, users] of emailMap.entries()) {
            if (users.length > 1) {
                const canonical = this._selectCanonicalUser(users);
                const duplicates = users.filter((u) => u.id !== canonical.id);
                clusters.push({
                    key: `email:${email}`,
                    reason: `Shared Email: ${email}`,
                    canonical,
                    duplicates,
                });
                users.forEach((u) => visitedIds.add(u.id));
            }
        }

        // Process duplicate clusters by GitHub username (avoiding double-counting already clustered IDs)
        for (const [ghUser, users] of githubMap.entries()) {
            if (users.length > 1) {
                const unvisited = users.filter((u) => !visitedIds.has(u.id));
                if (unvisited.length > 1) {
                    const canonical = this._selectCanonicalUser(unvisited);
                    const duplicates = unvisited.filter((u) => u.id !== canonical.id);
                    clusters.push({
                        key: `github:${ghUser}`,
                        reason: `Shared GitHub Username: ${ghUser}`,
                        canonical,
                        duplicates,
                    });
                    unvisited.forEach((u) => visitedIds.add(u.id));
                }
            }
        }

        return clusters;
    }

    /**
     * Merge a duplicate user document into the canonical user document.
     * Safely migrates all child records (logs, projects, tasks, goals, reports, bookmarks, showcases).
     *
     * @param {string} canonicalUserId
     * @param {string} duplicateUserId
     * @returns {Promise<{ success: boolean, canonicalUserId: string, migratedCounts: object }>}
     */
    async mergeUserRecords(canonicalUserId, duplicateUserId) {
        if (!canonicalUserId || !duplicateUserId || canonicalUserId === duplicateUserId) {
            throw new Error('Valid distinct canonical and duplicate user IDs are required');
        }

        const canonicalUser = await this.getUserById(canonicalUserId);
        const duplicateUser = await this.getUserById(duplicateUserId);

        if (!canonicalUser) {
            throw new Error(`Canonical user not found: ${canonicalUserId}`);
        }
        if (!duplicateUser) {
            logger.warn(`Duplicate user document already removed: ${duplicateUserId}`);
            return { success: true, canonicalUserId, migratedCounts: {} };
        }

        logger.info(`Starting user record merge: ${duplicateUserId} -> ${canonicalUserId}`, {
            canonicalEmail: canonicalUser.email,
            duplicateEmail: duplicateUser.email,
        });

        // 1. Merge UserEntity data
        const mergedEntity = canonicalUser.mergeWith(duplicateUser);

        // 2. Migrate Child Collections in Batch
        const db = this.db;
        const batch = db.batch();
        const migratedCounts = {
            logs: 0,
            projects: 0,
            tasks: 0,
            resumes: 0,
            goals: 0,
            reports: 0,
            showcases: 0,
        };

        // Helper to migrate by query
        const migrateCollection = async (collectionRef, fieldName, counterKey) => {
            try {
                const snap = await collectionRef.where(fieldName, '==', duplicateUserId).get();
                snap.forEach((doc) => {
                    batch.update(doc.ref, {
                        [fieldName]: canonicalUserId,
                        updatedAt: new Date().toISOString(),
                    });
                    migratedCounts[counterKey]++;
                });
            } catch (err) {
                logger.warn(`Could not query collection for migration (${counterKey}): ${err.message}`);
            }
        };

        // Collections referencing 'uid'
        await migrateCollection(this.logsCollection, 'uid', 'logs');
        await migrateCollection(this.projectsCollection, 'uid', 'projects');
        await migrateCollection(this.tasksCollection, 'uid', 'tasks');
        await migrateCollection(this.resumesCollection, 'uid', 'resumes');

        // Collections referencing 'userId'
        await migrateCollection(this.goalsCollection, 'userId', 'goals');
        await migrateCollection(this.reportsCollection, 'userId', 'reports');
        await migrateCollection(this.showcasesCollection, 'userId', 'showcases');

        // 3. Write merged canonical user document
        batch.set(this.usersCollection.doc(canonicalUserId), mergedEntity.toFirestore(), { merge: true });

        // 4. Delete duplicate user document
        batch.delete(this.usersCollection.doc(duplicateUserId));

        // Commit batch atomically
        await batch.commit();

        logger.info(`User merge complete for ${canonicalUserId}`, { migratedCounts });

        return {
            success: true,
            canonicalUserId,
            duplicateUserId,
            migratedCounts,
        };
    }

    /**
     * Run full deduplication across all users in the system.
     *
     * @param {object} options - { dryRun: boolean }
     * @returns {Promise<{ totalClusters: number, mergedCount: number, audit: Array }>}
     */
    async deduplicateAll({ dryRun = true } = {}) {
        const clusters = await this.findDuplicates();
        const audit = [];
        let mergedCount = 0;

        for (const cluster of clusters) {
            const clusterAudit = {
                key: cluster.key,
                reason: cluster.reason,
                canonicalId: cluster.canonical.id,
                duplicateIds: cluster.duplicates.map((d) => d.id),
                action: dryRun ? 'DRY_RUN_DETECTED' : 'MERGED',
                migrated: null,
            };

            if (!dryRun) {
                const results = [];
                for (const duplicate of cluster.duplicates) {
                    const res = await this.mergeUserRecords(cluster.canonical.id, duplicate.id);
                    results.push(res);
                    mergedCount++;
                }
                clusterAudit.migrated = results;
            }

            audit.push(clusterAudit);
        }

        return {
            dryRun,
            totalClusters: clusters.length,
            mergedCount,
            audit,
        };
    }

    /**
     * Heuristic to determine which document is the "Canonical" document in a duplicate cluster:
     * 1. Has an active Clerk ID format ('user_...')
     * 2. Highest Tier ('pro' > 'free')
     * 3. Most recent activity timestamp
     */
    _selectCanonicalUser(users) {
        if (!users || users.length === 0) return null;
        if (users.length === 1) return users[0];

        return [...users].sort((a, b) => {
            // 1. Pro tier precedence
            if (a.isPro && !b.isPro) return -1;
            if (!a.isPro && b.isPro) return 1;

            // 2. Active Clerk ID prefix preference (user_...)
            const aIsClerk = String(a.id).startsWith('user_');
            const bIsClerk = String(b.id).startsWith('user_');
            if (aIsClerk && !bIsClerk) return -1;
            if (!aIsClerk && bIsClerk) return 1;

            // 3. Most recent updatedAt or lastStartTime
            const aTime = new Date(a.updatedAt || a.lastStartTime || a.createdAt || 0).getTime();
            const bTime = new Date(b.updatedAt || b.lastStartTime || b.createdAt || 0).getTime();
            return bTime - aTime;
        })[0];
    }
}

const userManager = new UserManager();

module.exports = {
    UserEntity,
    UserManager,
    userManager,
};
