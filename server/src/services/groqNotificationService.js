/**
 * Groq Notification Service
 * Dedicated AI content generator for all DevTrack notifications.
 * Uses GROQ_NOTIFICATION_API_KEY (isolated from the main chat AI key)
 * to avoid rate-limit interference with other AI features.
 */

class GroqNotificationService {
    constructor() {
        this.apiKey = process.env.GROQ_NOTIFICATION_API_KEY;
        this.baseUrl = 'https://api.groq.com/openai/v1/chat/completions';
        this.model = 'openai/gpt-oss-120b';

        if (!this.apiKey) {
            console.warn('GROQ_NOTIFICATION_API_KEY not set — notification AI will use fallback messages.');
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // CORE API REQUEST (short, fast — max 150 tokens)
    // ─────────────────────────────────────────────────────────────────

    async _request(systemPrompt, userPrompt) {
        if (!this.apiKey) return null;

        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt },
                    ],
                    temperature: 0.6,
                    max_tokens: 150,
                    top_p: 0.9,
                }),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                console.error('Groq Notification API error:', err.error?.message || response.statusText);
                return null;
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content?.trim() || null;
        } catch (error) {
            console.error('Groq Notification request failed:', error.message);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // SYSTEM PROMPT — keeps all notification AI in "notif mode"
    // ─────────────────────────────────────────────────────────────────

    get _baseSystem() {
        return `You are DevTrack's notification writer. Write SHORT, PUNCHY, PERSONALIZED notification messages.
Rules:
- Title: max 8 words
- Body: max 20 words, specific to context, motivating or informative
- Tone: friendly, energetic, developer-focused
- NO generic filler, NO "Hey there!" openers
- Output ONLY valid JSON: {"title": "...", "body": "..."}`;
    }

    // ─────────────────────────────────────────────────────────────────
    // NOTIFICATION TYPE GENERATORS
    // ─────────────────────────────────────────────────────────────────

    /**
     * Consistency reminder — respects user's goal and current streak
     * @param {{ userGoal, streak, reminderMode, lastActive }} ctx
     */
    async generateConsistencyReminder(ctx) {
        const { userGoal = 'coding', streak = 0, reminderMode = 'adaptive' } = ctx;

        const prompt = `User goal: "${userGoal}". Current streak: ${streak} days. Reminder mode: ${reminderMode}.
Write a consistency reminder notification to motivate them to code today.`;

        const raw = await this._request(this._baseSystem, prompt);
        return this._parse(raw, {
            title: streak > 0 ? `🔥 ${streak}-Day Streak On The Line!` : '💻 Time to Code Today',
            body: `Keep your ${userGoal} momentum going. Open your editor and ship something!`,
        });
    }

    /**
     * Streak milestone — celebrate 7, 14, 30, 50, 100 day streaks
     * @param {{ userGoal, streak }} ctx
     */
    async generateStreakMilestone(ctx) {
        const { userGoal = 'coding', streak = 7 } = ctx;

        const prompt = `User just hit a ${streak}-day coding streak. Their goal is "${userGoal}". 
Write a celebratory milestone notification. Make them feel like a legend.`;

        const raw = await this._request(this._baseSystem, prompt);
        return this._parse(raw, {
            title: `🏆 ${streak}-Day Streak Milestone!`,
            body: `Incredible consistency on your "${userGoal}" journey. You're unstoppable!`,
        });
    }

    /**
     * Showcase star — someone starred the user's project
     * @param {{ projectName, starredByName, totalStars }} ctx
     */
    async generateShowcaseStar(ctx) {
        const { projectName = 'your project', starredByName = 'Someone', totalStars = 1 } = ctx;

        const prompt = `${starredByName} just starred the project "${projectName}". It now has ${totalStars} stars total.
Write a notification to the project owner. Be excited and specific.`;

        const raw = await this._request(this._baseSystem, prompt);
        return this._parse(raw, {
            title: `⭐ ${starredByName} starred ${projectName}!`,
            body: `Your project now has ${totalStars} star${totalStars !== 1 ? 's' : ''}. Keep shipping!`,
        });
    }

    /**
     * Showcase comment — someone commented on the user's project
     * @param {{ projectName, commenterName, commentSnippet }} ctx
     */
    async generateShowcaseComment(ctx) {
        const { projectName = 'your project', commenterName = 'Someone', commentSnippet = '' } = ctx;

        const snippet = commentSnippet.length > 60 ? commentSnippet.substring(0, 57) + '...' : commentSnippet;
        const prompt = `${commenterName} commented on "${projectName}": "${snippet}".
Write a notification to alert the project owner. Encourage them to reply.`;

        const raw = await this._request(this._baseSystem, prompt);
        return this._parse(raw, {
            title: `💬 ${commenterName} commented on ${projectName}`,
            body: snippet || 'You have a new comment on your showcase project.',
        });
    }

    /**
     * GitHub no commits — user hasn't committed today and it's late
     * @param {{ userGoal, streak, githubUsername }} ctx
     */
    async generateNoCommitsAlert(ctx) {
        const { userGoal = 'coding', streak = 0, githubUsername = '' } = ctx;

        const prompt = `Developer "${githubUsername}" hasn't made any GitHub commits today. Their streak is ${streak} days. Goal: "${userGoal}".
Write a gentle but urgent reminder to push at least 1 commit before midnight. Don't be annoying.`;

        const raw = await this._request(this._baseSystem, prompt);
        return this._parse(raw, {
            title: '⚡ No Commits Yet Today',
            body:
                streak > 0
                    ? `Your ${streak}-day streak is at risk! Push at least 1 commit before midnight.`
                    : 'Make your first commit of the day and start building momentum!',
        });
    }

    /**
     * Project revival — repo untouched for 2-12 weeks
     * @param {{ projectName, lastPushed, userGoal }} ctx
     */
    async generateProjectRevival(ctx) {
        const { projectName = 'a project', lastPushed = '', userGoal = 'coding' } = ctx;

        const weeksAgo = lastPushed
            ? Math.floor((Date.now() - new Date(lastPushed).getTime()) / (7 * 24 * 60 * 60 * 1000))
            : 2;

        const prompt = `Project "${projectName}" hasn't been updated in ~${weeksAgo} weeks. User goal: "${userGoal}".
Write a project revival reminder. Make them excited to pick it back up.`;

        const raw = await this._request(this._baseSystem, prompt);
        return this._parse(raw, {
            title: `🚀 Remember ${projectName}?`,
            body: `It's been ${weeksAgo} week${weeksAgo !== 1 ? 's' : ''}. One commit could reignite the momentum!`,
        });
    }

    /**
     * Task due notification
     * @param {{ taskTitle, dueType, priority }} ctx  dueType: 'today' | 'tomorrow'
     */
    async generateTaskDue(ctx) {
        const { taskTitle = 'a task', dueType = 'today', priority = 'high' } = ctx;

        const prompt = `A ${priority}-priority task "${taskTitle}" is due ${dueType}.
Write a task reminder notification. Urgent but not panic-inducing.`;

        const raw = await this._request(this._baseSystem, prompt);
        return this._parse(raw, {
            title: dueType === 'today' ? `⚠️ Task Due Today!` : `📌 Task Due Tomorrow`,
            body: `"${taskTitle}" — ${dueType === 'today' ? 'complete it before the day ends' : 'wrap it up tomorrow'}.`,
        });
    }

    /**
     * Break reminder — no activity for X minutes (frequent commit pattern users)
     * @param {{ inactiveMinutes, userName }} ctx
     */
    async generateBreakReminder(ctx) {
        const { inactiveMinutes = 90 } = ctx;

        const prompt = `Developer has been inactive for ${inactiveMinutes} minutes during a coding session.
Write a friendly break reminder. Suggest they log a break or step away consciously.`;

        const raw = await this._request(this._baseSystem, prompt);
        return this._parse(raw, {
            title: '☕ Taking a Break?',
            body: `${inactiveMinutes} min of inactivity detected. Log a break or keep your session active!`,
        });
    }

    /**
     * System / admin update notification
     * @param {{ updateTitle, updateDesc }} ctx
     */
    async generateSystemUpdate(ctx) {
        const { updateTitle = 'New Update', updateDesc = '' } = ctx;

        const prompt = `DevTrack has a new update: "${updateTitle}". Details: "${updateDesc}".
Write a system update notification for users. Keep it concise and exciting.`;

        const raw = await this._request(this._baseSystem, prompt);
        return this._parse(raw, {
            title: `🆕 ${updateTitle}`,
            body: updateDesc || 'DevTrack has been updated with new features. Check it out!',
        });
    }

    // ─────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────

    /**
     * Parse Groq JSON response safely, falling back to defaults.
     */
    _parse(raw, fallback) {
        if (!raw) return fallback;
        try {
            // Extract JSON even if Groq wraps it in markdown code blocks
            const jsonMatch = raw.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return fallback;
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                title: (parsed.title || fallback.title).substring(0, 80),
                body: (parsed.body || fallback.body).substring(0, 200),
            };
        } catch {
            return fallback;
        }
    }
}

// Singleton
let _instance = null;
const getGroqNotificationService = () => {
    if (!_instance) _instance = new GroqNotificationService();
    return _instance;
};

module.exports = { GroqNotificationService, getGroqNotificationService };
