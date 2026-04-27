const crypto = require('crypto');

const DEFAULT_GITHUB_ACCESS_DAYS = 7;
const ALLOWED_GITHUB_ACCESS_DAYS = [1, 3, 7, 14, 30];
const TOKEN_ENCRYPTION_VERSION = 1;
const TOKEN_ENCRYPTION_ALGORITHM = 'aes-256-gcm';

const getEncryptionKey = () => {
  const secret = process.env.GITHUB_TOKEN_ENCRYPTION_SECRET || process.env.SESSION_SECRET || process.env.JWT_SECRET || process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error('Missing encryption secret for GitHub token storage');
  }
  return crypto.createHash('sha256').update(secret).digest();
};

const encryptGithubToken = (token) => {
  if (!token) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(TOKEN_ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(token), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    githubAccessTokenEncrypted: encrypted.toString('base64'),
    githubAccessTokenIv: iv.toString('base64'),
    githubAccessTokenAuthTag: authTag.toString('base64'),
    githubAccessTokenAlgorithm: TOKEN_ENCRYPTION_ALGORITHM,
    githubAccessTokenVersion: TOKEN_ENCRYPTION_VERSION,
  };
};

const decryptGithubToken = (userData = {}) => {
  if (!userData) return null;

  // Backward compatibility for legacy plaintext records while migration is in progress.
  if (userData.githubAccessToken && typeof userData.githubAccessToken === 'string') {
    return userData.githubAccessToken;
  }

  const encrypted = userData.githubAccessTokenEncrypted;
  const iv = userData.githubAccessTokenIv;
  const authTag = userData.githubAccessTokenAuthTag;

  if (!encrypted || !iv || !authTag) return null;

  try {
    const decipher = crypto.createDecipheriv(
      userData.githubAccessTokenAlgorithm || TOKEN_ENCRYPTION_ALGORITHM,
      getEncryptionKey(),
      Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch {
    return null;
  }
};

const resolveGithubAccessDays = (value) => {
  const num = Number(value);
  if (Number.isFinite(num) && ALLOWED_GITHUB_ACCESS_DAYS.includes(num)) {
    return num;
  }
  return DEFAULT_GITHUB_ACCESS_DAYS;
};

const resolveGithubAccessDaysFromUser = (userData = {}) => {
  return resolveGithubAccessDays(userData?.preferences?.githubAccessRetentionDays);
};

const computeExpiryIso = (grantedAtIso, retentionDays = DEFAULT_GITHUB_ACCESS_DAYS) => {
  const grantedAt = grantedAtIso ? new Date(grantedAtIso) : new Date();
  if (Number.isNaN(grantedAt.getTime())) {
    const now = new Date();
    now.setDate(now.getDate() + retentionDays);
    return now.toISOString();
  }

  const expiry = new Date(grantedAt);
  expiry.setDate(expiry.getDate() + retentionDays);
  return expiry.toISOString();
};

const getGithubAccessWindow = (userData = {}) => {
  const retentionDays = resolveGithubAccessDaysFromUser(userData);
  const grantedAt = userData.githubAccessGrantedAt || null;
  const expiresAt = userData.githubAccessExpiresAt || (grantedAt ? computeExpiryIso(grantedAt, retentionDays) : null);

  return {
    retentionDays,
    grantedAt,
    expiresAt,
  };
};

const hasGithubAccessExpired = (userData = {}, now = new Date()) => {
  const { expiresAt } = getGithubAccessWindow(userData);
  if (!expiresAt) return false;

  const expiryDate = new Date(expiresAt);
  if (Number.isNaN(expiryDate.getTime())) return false;
  return now >= expiryDate;
};

const getActiveGithubToken = (userData = {}, now = new Date()) => {
  const token = decryptGithubToken(userData);
  if (!token) return null;
  return hasGithubAccessExpired(userData, now) ? null : token;
};

const hasStoredGithubAccess = (userData = {}, now = new Date()) => {
  return !!getActiveGithubToken(userData, now);
};

const buildGithubAccessUpdate = (token, userData = {}, now = new Date()) => {
  const retentionDays = resolveGithubAccessDaysFromUser(userData);
  const grantedAt = now.toISOString();
  const expiresAt = computeExpiryIso(grantedAt, retentionDays);
  const encrypted = encryptGithubToken(token);

  return {
    githubAccessToken: null,
    ...encrypted,
    githubAccessGrantedAt: grantedAt,
    githubAccessExpiresAt: expiresAt,
    githubAccessRetentionDays: retentionDays,
    updatedAt: now.toISOString(),
  };
};

const buildGithubAccessClearUpdate = (now = new Date()) => ({
  githubAccessToken: null,
  githubAccessTokenEncrypted: null,
  githubAccessTokenIv: null,
  githubAccessTokenAuthTag: null,
  githubAccessTokenAlgorithm: null,
  githubAccessTokenVersion: null,
  updatedAt: now.toISOString(),
});

module.exports = {
  DEFAULT_GITHUB_ACCESS_DAYS,
  ALLOWED_GITHUB_ACCESS_DAYS,
  resolveGithubAccessDays,
  resolveGithubAccessDaysFromUser,
  computeExpiryIso,
  getGithubAccessWindow,
  hasGithubAccessExpired,
  getActiveGithubToken,
  hasStoredGithubAccess,
  encryptGithubToken,
  decryptGithubToken,
  buildGithubAccessUpdate,
  buildGithubAccessClearUpdate,
};
