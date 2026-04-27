/**
 * README Controller
 * Generates and commits README files for projects
 */

const { collections } = require('../config/firebase');
const { APIError } = require('../middleware/errorHandler');
const { getGroqService } = require('../services/groqService');
const GitHubService = require('../services/githubService');
const {
    getActiveGithubToken,
    hasGithubAccessExpired,
    buildGithubAccessClearUpdate,
} = require('../services/githubAccessService');

/**
 * Parse GitHub URL to extract owner and repo
 */
const parseGitHubUrl = (url) => {
    if (!url) return null;
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
        return {
            owner: match[1],
            repo: match[2].replace(/\.git$/, '')
        };
    }
    return null;
};

/**
 * Generate README for a project
 * POST /api/readme/generate/:projectId
 */
const generateReadme = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { userId } = req.auth;

        console.log(`📝 Generating README for project ${projectId}`);

        // 1. Fetch the project
        const projectDoc = await collections.projects().doc(projectId).get();

        if (!projectDoc.exists) {
            throw new APIError('Project not found', 404);
        }

        const project = { id: projectDoc.id, ...projectDoc.data() };

        // Verify ownership
        if (project.uid !== userId) {
            throw new APIError('Unauthorized access to project', 403);
        }

        // 2. Check if project has a GitHub repository
        if (!project.repositoryUrl) {
            throw new APIError('Project must have a linked GitHub repository to generate README', 400);
        }

        const parsed = parseGitHubUrl(project.repositoryUrl);
        if (!parsed) {
            throw new APIError('Invalid GitHub repository URL', 400);
        }

        // 3. resolve github token from active access window
        const userDoc = await collections.users().doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        let userGithubToken = getActiveGithubToken(userData);
        if (!userGithubToken && hasGithubAccessExpired(userData)) {
            await collections.users().doc(userId).update(buildGithubAccessClearUpdate());
        }

        // 4. Initialize GitHub service with user's token or fallback to env PAT
        const githubService = new GitHubService(userGithubToken);

        // 5. Fetch complete repository information
        console.log(`📊 Fetching repo info for ${parsed.owner}/${parsed.repo}...`);
        const repoInfo = await githubService.getCompleteRepoInfo(parsed.owner, parsed.repo);

        // 5. Generate README using AI
        console.log(`🤖 Generating README with AI...`);
        const groqService = getGroqService();
        const result = await groqService.generateReadme(repoInfo);

        if (!result.success) {
            throw new APIError(result.error || 'Failed to generate README', 500);
        }

        res.status(200).json({
            success: true,
            data: {
                readme: result.readme,
                projectName: project.name,
                repoUrl: project.repositoryUrl,
            },
        });

    } catch (error) {
        console.error('Generate README error:', error);
        if (error.status === 404) {
            return next(new APIError('Repository not found or you do not have access. Please ensure your GitHub account is connected.', 404));
        }
        next(error);
    }
};

/**
 * Commit README to GitHub repository
 * POST /api/readme/commit/:projectId
 */
const commitReadme = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const { content, commitMessage = 'docs: update README.md' } = req.body;
        const { userId } = req.auth;

        if (!content) {
            throw new APIError('README content is required', 400);
        }

        console.log(`📤 Committing README for project ${projectId}`);

        // 1. Fetch the project
        const projectDoc = await collections.projects().doc(projectId).get();

        if (!projectDoc.exists) {
            throw new APIError('Project not found', 404);
        }

        const project = { id: projectDoc.id, ...projectDoc.data() };

        // Verify ownership
        if (project.uid !== userId) {
            throw new APIError('Unauthorized access to project', 403);
        }

        // 2. Check if project has a GitHub repository
        if (!project.repositoryUrl) {
            throw new APIError('Project must have a linked GitHub repository', 400);
        }

        const parsed = parseGitHubUrl(project.repositoryUrl);
        if (!parsed) {
            throw new APIError('Invalid GitHub repository URL', 400);
        }

        // 3. Resolve github token from active access window
        const userDoc = await collections.users().doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const userGithubToken = getActiveGithubToken(userData);
        if (!userGithubToken && hasGithubAccessExpired(userData)) {
            await collections.users().doc(userId).update(buildGithubAccessClearUpdate());
            throw new APIError('Private repository access expired. Reauthorize GitHub from settings.', 400);
        }

        // 4. Initialize GitHub service with user's token or fallback to env PAT
        const githubService = new GitHubService(userGithubToken);

        // 5. Commit the README file
        console.log(`📝 Committing README.md to ${parsed.owner}/${parsed.repo}...`);

        const result = await githubService.commitFile(
            parsed.owner,
            parsed.repo,
            'README.md',
            content,
            commitMessage
        );

        res.status(200).json({
            success: true,
            data: {
                commit: result.commit,
                content: result.content,
                message: 'README successfully committed to GitHub!',
            },
        });

    } catch (error) {
        console.error('Commit README error:', error);

        // Provide helpful error messages for common issues
        if (error.message?.includes('permission')) {
            return next(new APIError('You do not have permission to push to this repository. Make sure you have write access.', 403));
        }
        if (error.message?.includes('not found')) {
            return next(new APIError('Repository not found or you do not have access.', 404));
        }

        next(error);
    }
};

module.exports = {
    generateReadme,
    commitReadme,
};
