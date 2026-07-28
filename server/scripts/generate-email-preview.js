const fs = require('fs');
const path = require('path');

function generatePreview() {
    console.log('🎨 Generating rich Free vs Pro comparison email preview...');

    // Read local image
    const imgPath = path.join(__dirname, '../../client/public/DevTrack Social View.jpg');
    let imageHtml = '';
    if (fs.existsSync(imgPath)) {
        const imgBase64 = fs.readFileSync(imgPath).toString('base64');
        imageHtml = `<img src="data:image/jpeg;base64,${imgBase64}" alt="DevTrack — Build Faster. Track Smarter. Ship Like a Team." style="width: 100%; display: block;" />`;
    }

    const renderCard = (isExempt, name) => `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto 40px auto; background: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #333;">

            <!-- Hero Banner Image -->
            ${imageHtml ? `<div style="width: 100%; overflow: hidden;">${imageHtml}</div>` : ''}

            <!-- Main Content Body -->
            <div style="padding: 32px 28px 24px 28px;">

                <!-- Badge -->
                <div style="text-align: center; margin-bottom: 20px;">
                    ${isExempt
                        ? `<div style="background: #e8a838; color: #1a1a1a; font-weight: 800; padding: 8px 18px; border-radius: 6px; display: inline-block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;">👑 Permanent Founder Pro Access</div>`
                        : `<div style="background: #4dd0e1; color: #1a1a1a; font-weight: 800; padding: 8px 18px; border-radius: 6px; display: inline-block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;">⚡ 30-Day Pro Pass Unlocked</div>`}
                </div>

                <!-- Greeting & Emotional Hook -->
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 8px 0; text-align: center;">Hey ${name} 👋</h1>
                <p style="color: #cccccc; font-size: 15px; line-height: 1.7; text-align: center; margin: 0 0 28px 0;">
                    ${isExempt
                        ? `As the creator of DevTrack, your account has <strong style="color: #e8a838;">Permanent Unlimited Pro Access</strong> across all features — no expiry, no limits, ever. Here is a look at the upgraded ecosystem.`
                        : `We miss seeing your commits! To welcome you back, we've unlocked <strong style="color: #4dd0e1;">DevTrack Pro for 30 days</strong> — 100% free, no credit card needed. Check out how DevTrack has evolved into a complete developer hub.`}
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

                ${isExempt
                    ? `<p style="color: #e8a838; font-size: 12px; font-weight: 700; margin: 20px 0 0 0; text-align: center;">Your account is permanently exempted from auto-downgrade.</p>`
                    : `<p style="color: #999999; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">After 30 days, your account seamlessly moves to the Free Starter tier.<br/>Keep Pro anytime for just <strong style="color: #4dd0e1;">₹199/month</strong> (India) or <strong style="color: #4dd0e1;">$5/month</strong> (International).</p>`}
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

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>DevTrack High-Engagement Email Preview</title>
    <style>
        body { margin: 0; padding: 40px 10px; background: #0b0f19; }
        .label { color: #888; font-family: sans-serif; text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 12px; text-transform: uppercase; }
    </style>
</head>
<body>
    <div class="label">--- Single Email Sent to User (Sample Preview) ---</div>
    ${renderCard(false, 'Developer')}
</body>
</html>`;

    const outputPath = path.join(__dirname, '../email-preview-vortex16.html');
    fs.writeFileSync(outputPath, htmlContent);
    console.log('✅ Generated single-card rich email preview at:', outputPath);
}

generatePreview();
