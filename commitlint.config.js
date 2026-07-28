/**
 * Commitlint Configuration
 * Enforces conventional commit messages: feat, fix, docs, chore, refactor, test, ci, perf, style, build
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'chore', 'refactor', 'test', 'ci', 'perf', 'style', 'build'],
    ],
    'subject-min-length': [2, 'always', 5],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [1, 'always', 100],
  },
};
