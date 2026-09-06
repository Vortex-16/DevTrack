/**
 * Admin & Permanent Pro Access Configuration
 * ═══════════════════════════════════════════════════════════════════════════
 * Single source of truth for founders and core contributors who have
 * permanent, lifetime Pro access without expiration or auto-downgrade.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// Permanent core contributors / founders
const PERMANENT_CONTRIBUTORS = [
    {
        name: 'Vikash Gupta',
        role: 'Founder & Lead Developer',
        githubUsernames: ['vortex-16', 'vortex16'],
        emails: ['vikash9c35@gmail.com', 'vikasharmy811@gmail.com'],
    },
    {
        name: 'Ayush Chaudhary',
        role: 'Core Contributor',
        githubUsernames: ['ayushchowdhurycse', 'ayushchowdhury', 'ayushchaudhary'],
        emails: ['ayushatwork142@gmail.com'],
    },
];

// Flattened normalized sets for fast O(1) lookups
const PERMANENT_GITHUB_USERS = new Set(
    PERMANENT_CONTRIBUTORS.flatMap((c) => c.githubUsernames.map((u) => u.toLowerCase().trim()))
);

const PERMANENT_EMAILS = new Set(PERMANENT_CONTRIBUTORS.flatMap((c) => c.emails.map((e) => e.toLowerCase().trim())));

/**
 * Checks whether a given user qualifies for Permanent Lifetime Pro access.
 * Matches by GitHub username, email, or database flag.
 *
 * @param {Object} params
 * @param {string} [params.githubUsername]
 * @param {string} [params.email]
 * @param {string} [params.userId]
 * @param {boolean} [params.isExemptFromDowngrade]
 * @returns {boolean}
 */
function isPermanentProUser({ githubUsername, email, isExemptFromDowngrade } = {}) {
    if (isExemptFromDowngrade === true) {
        return true;
    }

    if (githubUsername) {
        const cleanGithub = String(githubUsername).toLowerCase().trim();
        if (PERMANENT_GITHUB_USERS.has(cleanGithub)) {
            return true;
        }
    }

    if (email) {
        const cleanEmail = String(email).toLowerCase().trim();
        if (PERMANENT_EMAILS.has(cleanEmail)) {
            return true;
        }
    }

    return false;
}

/**
 * Get the list of permanent contributors.
 * @returns {Array<Object>}
 */
function getPermanentContributors() {
    return PERMANENT_CONTRIBUTORS;
}

module.exports = {
    PERMANENT_CONTRIBUTORS,
    PERMANENT_GITHUB_USERS,
    PERMANENT_EMAILS,
    isPermanentProUser,
    getPermanentContributors,
};
