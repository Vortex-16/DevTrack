/**
 * Email Service
 * Handles all email sending using Brevo REST API (HTTP - works on Render)
 * Uses Node.js built-in fetch (Node 18+) — no extra dependencies
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { collections } = require('../config/firebase');

class EmailService {
    constructor() {
        this.apiKey = process.env.BREVO_API_KEY;
        this.apiUrl = 'https://api.brevo.com/v3/smtp/email';
        this.defaultFrom = {
            email: process.env.EMAIL_FROM || 'alpha4coders@gmail.com',
            name: process.env.EMAIL_FROM_NAME || 'DevTrack',
        };

        // Initialize Nodemailer transporter if SMTP credentials are preset
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            const cleanPass = (process.env.SMTP_PASS || '').replace(/^["']|["']$/g, '');
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '465', 10),
                secure: parseInt(process.env.SMTP_PORT || '465', 10) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: cleanPass,
                },
            });
            console.log('📧 Nodemailer SMTP initialized with Gmail');
        } else {
            console.log('📧 Email service initialized with Brevo');
        }
    }

    /**
     * Send an email via Brevo REST API
     * @param {Object} options
     * @param {string} options.to - Recipient email
     * @param {string} options.subject - Email subject
     * @param {string} options.html - HTML content
     * @param {string} [options.from] - Sender email (optional)
     * @param {Array}  [options.attachments] - Array of attachment objects
     * @returns {Promise<Object>} - Send result
     */
    async sendEmail({ to, subject, html, from, attachments = [] }) {
        try {
            if (!this.apiKey) {
                throw new Error('BREVO_API_KEY is not configured');
            }

            const payload = {
                sender: from ? { email: from } : this.defaultFrom,
                to: [{ email: to }],
                subject,
                htmlContent: html,
            };

            if (attachments.length > 0) {
                payload.attachment = attachments.map((att) => ({
                    name: att.filename,
                    content: att.content, // base64 string
                }));
            }

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'api-key': this.apiKey,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (!response.ok) {
                const errMsg = result.message || `HTTP ${response.status}`;
                console.error(`❌ Brevo error sending to ${to}:`, errMsg);
                return { success: false, error: errMsg };
            }

            console.log(`✅ Email sent to ${to}, messageId: ${result.messageId}`);
            return { success: true, messageId: result.messageId };
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send weekly report email with PDF attachment
     * @param {string} to - Recipient email
     * @param {string} userName - User's name for greeting
     * @param {Buffer} pdfBuffer - PDF report buffer
     * @param {string} aiSummary - AI generated summary snippet
     * @returns {Promise<Object>}
     */
    async sendWeeklyReport(to, userName, pdfBuffer, aiSummary = '') {
        const subject = `Your Weekly GitHub Report - ${new Date().toLocaleDateString()}`;

        const aiSection = aiSummary
            ? `
            <div style="background: #1e293b; border-left: 4px solid #6366f1; padding: 20px; margin: 24px 0; border-radius: 8px;">
                <h3 style="color: #6366f1; margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">✨ AI Weekly Insight</h3>
                <p style="color: #e2e8f0; margin-bottom: 0; font-style: italic; line-height: 1.6;">"${aiSummary}"</p>
            </div>
        `
            : '';

        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; padding: 40px; border-radius: 16px;">
                <h1 style="color: #6366f1; margin-bottom: 8px;">Weekly DevTrack Report</h1>
                <p style="color: #94a3b8; margin-bottom: 24px;">Hi ${userName},</p>
                
                <p style="color: #e2e8f0;">Your weekly GitHub activity report is attached as a PDF.</p>
                
                ${aiSection}
                
                <p style="color: #e2e8f0;">Keep up the great work and maintain your coding streak!</p>
                <hr style="border: 1px solid #1e293b; margin: 24px 0;">
                <p style="color: #64748b; font-size: 12px;">Generated by DevTrack - Your Developer Consistency Tracker</p>
            </div>
        `;

        return this.sendEmail({
            to,
            subject,
            html,
            attachments: [
                {
                    filename: `devtrack-report-${new Date().toISOString().split('T')[0]}.pdf`,
                    content: pdfBuffer.toString('base64'),
                    encoding: 'base64',
                },
            ],
        });
    }

    /**
     * Send comment notification email
     * @param {string} to - Project owner's email
     * @param {string} projectName - Name of the project
     * @param {string} commenterName - Name of the person who commented
     * @param {string} commentContent - The comment content (already escaped)
     * @returns {Promise<Object>}
     */
    async sendCommentNotification(to, projectName, commenterName, commentContent) {
        const subject = `💬 New comment on "${projectName}"`;
        const html = `
            <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #7c3aed;">New Comment on Your Showcase</h2>
                <p><strong>${commenterName}</strong> commented on your project <strong>"${projectName}"</strong>:</p>
                <blockquote style="border-left: 4px solid #7c3aed; padding-left: 16px; margin: 16px 0; color: #374151;">
                    ${commentContent}
                </blockquote>
                <p style="color: #6b7280; font-size: 14px;">View your showcase on DevTrack to reply.</p>
            </div>
        `;

        return this.sendEmail({ to, subject, html });
    }
    /**
     * Send Pro Trial Announcement Email (Redesigned — DevTrack Poster Aesthetic)
     * Colors: Dark black (#1a1a1a), Cyan/Teal borders (#4dd0e1), Warm copper (#e8a838), White text
     * @param {string} to - Recipient email
     * @param {string} userName - User's name
     * @param {boolean} [isExempt=false] - True if user is Vortex-16 (permanent Pro)
     * @returns {Promise<Object>}
     */
    async sendProTrialAnnouncementEmail(to, userName = 'Developer', isExempt = false) {
        const subject = isExempt
            ? `👑 Vortex-16 — Your Permanent Pro Founder Access is Active`
            : `🚀 You've Been Upgraded to DevTrack Pro — 30 Days Free`;

        // Find social preview image for inline CID attachment
        const possiblePaths = [
            path.join(__dirname, '../../../client/public/DevTrack Social View.jpg'),
            path.join(process.cwd(), '../client/public/DevTrack Social View.jpg'),
            path.join(process.cwd(), 'client/public/DevTrack Social View.jpg'),
        ];
        let imagePath = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                imagePath = p;
                break;
            }
        }

        // Use inline CID tag for 100% reliable rendering in Gmail, Outlook & Apple Mail
        const imageHtml = imagePath
            ? `<img src="cid:devtrack-poster" alt="DevTrack — Build Faster. Track Smarter. Ship Like a Team." style="width: 100%; display: block;" />`
            : '';

        // --- Dynamic content based on founder vs standard user ---
        const badgeHtml = isExempt
            ? `<div style="background: #e8a838; color: #1a1a1a; font-weight: 800; padding: 8px 18px; border-radius: 6px; display: inline-block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;">👑 Permanent Founder Pro Access</div>`
            : `<div style="background: #4dd0e1; color: #1a1a1a; font-weight: 800; padding: 8px 18px; border-radius: 6px; display: inline-block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;">⚡ 30-Day Pro Pass Unlocked</div>`;

        const greetingText = isExempt
            ? `As the creator of DevTrack, your account has <strong style="color: #e8a838;">Permanent Unlimited Pro Access</strong> across all features — no expiry, no limits, ever. Here is a look at the upgraded ecosystem.`
            : `We miss seeing your commits! To welcome you back, we've unlocked <strong style="color: #4dd0e1;">DevTrack Pro for 30 days</strong> — 100% free, no credit card needed. Check out how DevTrack has evolved into a complete developer hub.`;

        const footerNote = isExempt
            ? `<p style="color: #e8a838; font-size: 12px; font-weight: 700; margin: 20px 0 0 0; text-align: center;">Your account is permanently exempted from auto-downgrade.</p>`
            : `<p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">After 30 days, your account seamlessly moves to the Free Starter tier.<br/>Keep Pro anytime for just <strong style="color: #4dd0e1;">₹199/month</strong> (India) or <strong style="color: #4dd0e1;">$5/month</strong> (International).</p>`;

        const html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden;">

                <!-- Hero Banner Image -->
                ${imageHtml ? `<div style="width: 100%; overflow: hidden;">${imageHtml}</div>` : ''}

                <!-- Main Content Body -->
                <div style="padding: 32px 28px 24px 28px;">

                    <!-- Badge -->
                    <div style="text-align: center; margin-bottom: 20px;">
                        ${badgeHtml}
                    </div>

                    <!-- Greeting & Emotional Hook -->
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 8px 0; text-align: center;">Hey ${userName} 👋</h1>
                    <p style="color: #cccccc; font-size: 15px; line-height: 1.7; text-align: center; margin: 0 0 28px 0;">
                        ${greetingText}
                    </p>

                    <!-- Quote Box (From Poster) -->
                    <div style="background: #111111; border-left: 4px solid #e8a838; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
                        <p style="color: #e8a838; font-weight: 700; font-size: 14px; line-height: 1.5; margin: 0; text-transform: uppercase; letter-spacing: 0.03em;">
                            "DevTrack transforms chaotic student & developer projects into production-level development workflows."
                        </p>
                    </div>

                    <!-- What's New Section -->
                    <h3 style="color: #ffffff; font-size: 16px; font-weight: 800; margin: 0 0 16px 0; text-align: center; text-transform: uppercase; letter-spacing: 0.05em;">
                        🔥 What's Inside Your Upgraded Workspace
                    </h3>

                    <!-- Detailed Feature Cards -->
                    <div style="margin-bottom: 28px;">

                        <!-- Feature 1 -->
                        <div style="background: #222222; border: 1px solid #4dd0e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 12px;">
                            <div style="font-size: 14px; margin-bottom: 6px;">
                                <span style="color: #e8a838; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">🧠 AI Code Assistant &amp; Vision Support</span>
                            </div>
                            <div style="color: #bbbbbb; font-size: 13px; line-height: 1.6;">
                                Powered by Groq &amp; Gemini with RAG over indexed GitHub repositories. Attach code screenshots, analyze errors, and run automated code reviews instantly.
                            </div>
                        </div>

                        <!-- Feature 2 -->
                        <div style="background: #222222; border: 1px solid #4dd0e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 12px;">
                            <div style="font-size: 14px; margin-bottom: 6px;">
                                <span style="color: #e8a838; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">📊 GitHub Analytics &amp; Automated PDF Reports</span>
                            </div>
                            <div style="color: #bbbbbb; font-size: 13px; line-height: 1.6;">
                                Sync up to 15 repositories. Track active streaks, commit heatmaps, pull request flow, and receive automated weekly PDF growth summaries via email.
                            </div>
                        </div>

                        <!-- Feature 3 -->
                        <div style="background: #222222; border: 1px solid #4dd0e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 12px;">
                            <div style="font-size: 14px; margin-bottom: 6px;">
                                <span style="color: #e8a838; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">📄 AI Resume Builder &amp; Showcase Hub</span>
                            </div>
                            <div style="color: #bbbbbb; font-size: 13px; line-height: 1.6;">
                                Convert your real GitHub activity into polished resume bullets and showcase your best projects publicly to recruiters and peers.
                            </div>
                        </div>

                        <!-- Feature 4 -->
                        <div style="background: #222222; border: 1px solid #4dd0e1; border-radius: 10px; padding: 18px 20px; margin-bottom: 12px;">
                            <div style="font-size: 14px; margin-bottom: 6px;">
                                <span style="color: #e8a838; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em;">⚡ Command Palette &amp; Real-Time Sync</span>
                            </div>
                            <div style="color: #bbbbbb; font-size: 13px; line-height: 1.6;">
                                Press <code style="background: #333; color: #4dd0e1; padding: 2px 6px; border-radius: 4px;">Cmd + K</code> anytime for instant search, live task notifications, and low-latency Socket.IO sync.
                            </div>
                        </div>

                    </div>

                    <!-- Free vs Pro Comparison Table -->
                    <div style="background: #111111; border: 1px solid #4dd0e1; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                        <h4 style="color: #ffffff; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 16px 0; text-align: center;">
                            ⚡ Free Starter vs. Pro Pass Comparison
                        </h4>
                        <table style="width: 100%; font-size: 12px; border-collapse: collapse; color: #cccccc;">
                            <thead>
                                <tr style="border-bottom: 2px solid #333; text-align: left;">
                                    <th style="padding: 8px 4px; color: #888; text-transform: uppercase; font-size: 11px;">Feature</th>
                                    <th style="padding: 8px 4px; color: #aaaaaa; text-transform: uppercase; font-size: 11px; text-align: center;">Free Tier</th>
                                    <th style="padding: 8px 4px; color: #e8a838; text-transform: uppercase; font-size: 11px; text-align: right;">🔥 Pro Pass</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid #222;">
                                    <td style="padding: 10px 4px; color: #ffffff; font-weight: 600;">Active Projects</td>
                                    <td style="padding: 10px 4px; text-align: center; color: #888888;">3 Repos</td>
                                    <td style="padding: 10px 4px; text-align: right; color: #e8a838; font-weight: 800;">15 Repos</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #222;">
                                    <td style="padding: 10px 4px; color: #ffffff; font-weight: 600;">AI Chat Messages</td>
                                    <td style="padding: 10px 4px; text-align: center; color: #888888;">25 / day</td>
                                    <td style="padding: 10px 4px; text-align: right; color: #e8a838; font-weight: 800;">200 / day</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #222;">
                                    <td style="padding: 10px 4px; color: #ffffff; font-weight: 600;">AI Code Reviews</td>
                                    <td style="padding: 10px 4px; text-align: center; color: #888888;">2 / day</td>
                                    <td style="padding: 10px 4px; text-align: right; color: #e8a838; font-weight: 800;">20 / day</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #222;">
                                    <td style="padding: 10px 4px; color: #ffffff; font-weight: 600;">AI Project Analyses</td>
                                    <td style="padding: 10px 4px; text-align: center; color: #888888;">1 / day</td>
                                    <td style="padding: 10px 4px; text-align: right; color: #e8a838; font-weight: 800;">15 / day</td>
                                </tr>
                                <tr style="border-bottom: 1px solid #222;">
                                    <td style="padding: 10px 4px; color: #ffffff; font-weight: 600;">PDF Growth Reports</td>
                                    <td style="padding: 10px 4px; text-align: center; color: #888888;">1 / month</td>
                                    <td style="padding: 10px 4px; text-align: right; color: #4dd0e1; font-weight: 800;">Unlimited</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 4px; color: #ffffff; font-weight: 600;">Resume Builder AI</td>
                                    <td style="padding: 10px 4px; text-align: center; color: #888888;">Basic</td>
                                    <td style="padding: 10px 4px; text-align: right; color: #4dd0e1; font-weight: 800;">Advanced AI</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Main Slogan Tagline -->
                    <p style="color: #ffffff; font-size: 16px; font-weight: 800; text-align: center; margin: 0 0 24px 0;">
                        Build Faster. Track Smarter. <span style="color: #e8a838;">Ship Like a Team.</span>
                    </p>

                    <!-- CTA Button -->
                    <div style="text-align: center; margin-bottom: 24px;">
                        <a href="https://devtrackweb.xyz/dashboard" style="background: #e8a838; color: #1a1a1a; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 800; font-size: 15px; display: inline-block; letter-spacing: 0.02em; box-shadow: 0 4px 20px rgba(232, 168, 56, 0.3);">
                            🚀 Launch DevTrack Dashboard →
                        </a>
                    </div>

                    ${footerNote}
                </div>

                <!-- Footer -->
                <div style="border-top: 1px solid #333333; padding: 24px 28px; text-align: center;">
                    <p style="color: #777777; font-size: 12px; margin: 0 0 6px 0;">DevTrack • Empowering Developers &amp; Engineering Teams</p>
                    <p style="color: #555555; font-size: 11px; margin: 0;">
                        <a href="https://devtrackweb.xyz" style="color: #4dd0e1; text-decoration: none;">devtrackweb.xyz</a> &nbsp;•&nbsp;
                        <a href="https://devtrackweb.xyz/guide" style="color: #4dd0e1; text-decoration: none;">User Guide</a> &nbsp;•&nbsp;
                        <a href="https://devtrackweb.xyz/pricing" style="color: #4dd0e1; text-decoration: none;">Pricing</a>
                    </p>
                </div>
            </div>
        `;

        const attachments = imagePath
            ? [
                  {
                      filename: 'DevTrack Social View.jpg',
                      path: imagePath,
                      cid: 'devtrack-poster',
                  },
              ]
            : [];

        if (this.transporter) {
            try {
                const info = await this.transporter.sendMail({
                    from: `"${process.env.EMAIL_FROM_NAME || 'DevTrack'}" <${process.env.SMTP_USER}>`,
                    to,
                    subject,
                    html,
                    attachments,
                });
                console.log(`✅ Nodemailer email sent to ${to}, messageId: ${info.messageId}`);
                return { success: true, messageId: info.messageId };
            } catch (err) {
                console.error(`❌ Nodemailer failed sending to ${to}:`, err.message);
            }
        }

        return this.sendEmail({ to, subject, html });
    }

    /**
     * Broadcast Pro Trial announcement email to all existing users in Firestore
     * Runs asynchronously on server boot (idempotent — won't re-send if proTrialEmailSent is true)
     */
    async broadcastProTrialEmailsOnStartup() {
        try {
            console.log('📧 [Startup Broadcast] Checking users for Pro trial announcement email...');
            const usersSnapshot = await collections.users().get();
            if (usersSnapshot.empty) return;

            let sentCount = 0;
            let skippedCount = 0;

            for (const doc of usersSnapshot.docs) {
                const userData = doc.data();
                const userId = doc.id;
                const email = userData.email;

                if (!email) {
                    skippedCount++;
                    continue;
                }

                // Idempotency check: don't re-send if already sent
                if (userData.proTrialEmailSent) {
                    skippedCount++;
                    continue;
                }

                const githubUsername = (userData.githubUsername || '').toLowerCase();
                const isExempt =
                    githubUsername === 'vortex-16' ||
                    githubUsername === 'vortex16' ||
                    email.toLowerCase().includes('alpha4coders') ||
                    userData.isExemptFromDowngrade === true;

                const result = await this.sendProTrialAnnouncementEmail(email, userData.name || 'Developer', isExempt);

                if (result.success) {
                    sentCount++;
                    await collections.users().doc(userId).set(
                        {
                            proTrialEmailSent: true,
                            proTrialEmailSentAt: new Date().toISOString(),
                        },
                        { merge: true }
                    );
                }

                // Small 200ms delay to prevent rate-limit bursts
                await new Promise((r) => setTimeout(r, 200));
            }

            console.log(`✅ [Startup Broadcast] Completed! Sent: ${sentCount}, Skipped: ${skippedCount}`);
        } catch (error) {
            console.error('❌ [Startup Broadcast] Failed to send broadcast emails:', error.message);
        }
    }

    /**
     * Verify Brevo configuration
     * @returns {Promise<boolean>}
     */
    async verifyConnection() {
        if (!this.apiKey) {
            console.error('❌ BREVO_API_KEY is not set!');
            return false;
        }
        console.log('✅ Brevo API key is configured');
        return true;
    }
}

module.exports = new EmailService();
