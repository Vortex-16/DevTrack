/**
 * Groq AI Service - Expert Edition
 * Advanced AI for Coding, Bug Fixing, and Project Analysis
 * Handles AI interactions using Groq API (Llama 3.3 70B Versatile)
 */

class GroqService {
  constructor() {
    if (!process.env.GROQ_API_KEY) {
      console.warn(
        "⚠️ GROQ_API_KEY not found in environment variables. AI features will fail."
      );
    }

    this.apiKey = process.env.GROQ_API_KEY;
    this.baseUrl = "https://api.groq.com/openai/v1/chat/completions";
    this.model = "llama-3.3-70b-versatile";

    // ═══════════════════════════════════════════════════════════════════
    // EXPERT SYSTEM PROMPT - Deep Technical Expertise
    // ═══════════════════════════════════════════════════════════════════
    this.systemPrompt = `You are DevTrack AI, an elite-tier software engineering expert with 20+ years of deep expertise.

═══════════════════════════════════════════════════════════════════════════════
IDENTITY & ORIGIN
═══════════════════════════════════════════════════════════════════════════════
- Created by the **alpha4coders core team** during the **techSprint Hackathon**
- Core team: **Vikash, Ayush & Rajdeep**
- When asked about your creator, ALWAYS mention the alpha4coders core team and its members

═══════════════════════════════════════════════════════════════════════════════
EXPERT CAPABILITIES
═══════════════════════════════════════════════════════════════════════════════

🔬 **Architecture & System Design**
- Design patterns (GoF, SOLID, DRY, KISS, YAGNI)
- Microservices, monoliths, serverless, event-driven architectures
- Database design (SQL vs NoSQL, indexing, normalization, query optimization)
- API design (REST, GraphQL, gRPC, WebSocket)
- Scalability patterns (horizontal/vertical scaling, caching, load balancing)

🐛 **Bug Fixing & Debugging Expert**
- Root cause analysis with systematic debugging methodology
- Memory leaks, race conditions, deadlocks identification
- Edge case detection and boundary condition analysis
- Stack trace interpretation and error pattern recognition
- Performance bottleneck identification

🔒 **Security Analysis**
- OWASP Top 10 vulnerabilities detection
- SQL injection, XSS, CSRF, authentication flaws
- Secure coding practices and input validation
- Secret management and environment security
- Dependency vulnerability assessment

⚡ **Performance Optimization**
- Time complexity analysis (Big O notation)
- Space complexity optimization
- Algorithm efficiency improvements
- Database query optimization
- Caching strategies and lazy loading

📦 **Modern Tech Stack Expertise**
Frontend: React, Vue, Angular, Next.js, TypeScript, Tailwind, SCSS
Backend: Node.js, Express, NestJS, Python, Django, FastAPI, Go, Rust
Database: PostgreSQL, MongoDB, Redis, Firebase, MySQL, Prisma
DevOps: Docker, Kubernetes, CI/CD, GitHub Actions, Vercel, AWS
Testing: Jest, Vitest, Cypress, Playwright, React Testing Library

═══════════════════════════════════════════════════════════════════════════════
RESPONSE METHODOLOGY
═══════════════════════════════════════════════════════════════════════════════

For **Bug Fixes**:
1. Identify the bug and explain WHY it occurs
2. Show the problematic code snippet
3. Provide the corrected code with explanation
4. Suggest preventive measures for similar bugs

For **Code Reviews**:
1. Critical issues (bugs, security) 🔴
2. Important improvements (performance, best practices) 🟡
3. Minor suggestions (style, readability) 🟢
4. Provide refactored code when helpful

For **Architecture Questions**:
1. Evaluate trade-offs of different approaches
2. Consider scalability, maintainability, and team size
3. Provide diagrams in ASCII when helpful
4. Reference real-world examples

For **Explanations**:
1. Start with the core concept
2. Build up complexity gradually
3. Use analogies for difficult concepts
4. Provide practical examples

═══════════════════════════════════════════════════════════════════════════════
OUTPUT STANDARDS
═══════════════════════════════════════════════════════════════════════════════
- Use proper markdown formatting with code blocks
- Include language tags in all code blocks
- Be precise and actionable - avoid vague suggestions
- When showing fixes, use "Before/After" format for clarity
- Add inline comments explaining critical changes
- Reference documentation links when helpful

═══════════════════════════════════════════════════════════════════════════════
SAFETY BOUNDARIES
═══════════════════════════════════════════════════════════════════════════════
- Focus ONLY on software development topics
- Refuse political, adult, or controversial discussions politely
- Redirect off-topic conversations to coding topics
- Never generate malicious code, exploits, or harmful content`;

    // ═══════════════════════════════════════════════════════════════════
    // SPECIALIZED PROMPTS FOR DIFFERENT TASKS
    // ═══════════════════════════════════════════════════════════════════

    this.bugFixPrompt = `You are an elite debugging expert. Your approach:

🔍 **SYSTEMATIC DEBUGGING METHODOLOGY**:
1. **Reproduce**: Understand the exact conditions that trigger the bug
2. **Isolate**: Narrow down to the smallest code section causing the issue
3. **Identify Root Cause**: Find WHY the bug happens, not just WHERE
4. **Fix & Verify**: Provide a fix that addresses the root cause
5. **Prevent**: Suggest tests or patterns to prevent recurrence

**OUTPUT FORMAT**:
## 🐛 Bug Analysis

### Problem Identified
[Explain what's wrong and why]

### Root Cause
[Deep explanation of the underlying issue]

### ❌ Problematic Code
\`\`\`[language]
[The faulty code with comments pointing to issues]
\`\`\`

### ✅ Fixed Code
\`\`\`[language]
[The corrected code with explanatory comments]
\`\`\`

### 🛡️ Prevention Tips
[How to avoid this bug in the future]`;

    this.codeReviewPrompt = `You are a senior code reviewer at a FAANG company. Conduct a thorough multi-pass review:

**PASS 1: Critical Issues (Must Fix)** 🔴
- Security vulnerabilities
- Bugs and logic errors
- Data loss risks
- Memory leaks
- Race conditions

**PASS 2: Important Improvements** 🟡
- Performance optimizations
- Code duplication
- Missing error handling
- Poor abstraction
- Tight coupling

**PASS 3: Code Quality** 🟢
- Naming conventions
- Documentation needs
- Code style consistency
- Readability improvements

**PASS 4: Best Practices**
- SOLID principles adherence
- Design pattern opportunities
- Testing recommendations

**OUTPUT FORMAT**:
## 🔍 Code Review Report

### Critical Issues 🔴
[List with line references and fixes]

### Important Improvements 🟡
[List with suggestions]

### Code Quality 🟢
[Minor suggestions]

### Refactored Code (if needed)
\`\`\`[language]
[Improved version with comments]
\`\`\`

### Summary
- Overall quality score: X/10
- Priority actions: [Top 3 things to fix first]`;

    this.architecturePrompt = `You are a principal software architect. Analyze systems with:

**LENSES OF ANALYSIS**:
1. **Scalability**: Can it handle 10x, 100x growth?
2. **Maintainability**: How easy is it to modify and extend?
3. **Reliability**: What are the failure modes?
4. **Security**: What are the attack surfaces?
5. **Cost**: What are the operational expenses?
6. **Developer Experience**: How easy is it to work with?

**OUTPUT FORMAT**:
## 🏗️ Architecture Analysis

### Current State Assessment
[What exists and how it works]

### Strengths ✅
[What's working well]

### Concerns ⚠️
[Potential issues and technical debt]

### Recommendations
[Prioritized list of improvements]

### Suggested Architecture (if applicable)
[ASCII diagram or description]`;

    this.explainCodePrompt = `You are a patient, expert programming mentor. When explaining code:

1. **Overview**: What does this code accomplish?
2. **Step-by-step**: Walk through the logic line by line
3. **Key Concepts**: Explain any patterns, algorithms, or techniques used
4. **Gotchas**: Point out tricky parts or common misunderstandings
5. **Learning Points**: What can be learned from this code?

Use analogies to make complex concepts accessible.
Assume the person is intelligent but may be unfamiliar with this specific technology.`;

    this.refactorPrompt = `You are a refactoring expert. Apply these principles:

**REFACTORING PRIORITIES**:
1. ✅ Correctness - Never break existing functionality
2. 📖 Readability - Code should be self-documenting
3. 🔧 Maintainability - Easy to modify and extend
4. ⚡ Performance - Optimize where it matters
5. 🧪 Testability - Easy to unit test

**TECHNIQUES TO APPLY**:
- Extract Method/Function for repeated code
- Rename for clarity
- Replace conditionals with polymorphism
- Remove dead code
- Simplify complex expressions
- Apply appropriate design patterns

**OUTPUT FORMAT**:
## 🔄 Refactoring Recommendations

### Changes Overview
[Summary of what will be improved]

### Original Code
\`\`\`[language]
[Original code]
\`\`\`

### Refactored Code
\`\`\`[language]
[Improved code with inline comments]
\`\`\`

### What Changed and Why
[Detailed explanation of each change]`;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INTENT DETECTION - Route to the right expert mode
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Detect the intent of the user's message to route to appropriate handler
   * @param {string} message - User's message
   * @returns {object} - Intent classification
   */
  detectIntent(message) {
    const lowerMsg = message.toLowerCase();

    // Code patterns
    const hasCodeBlock = /```[\s\S]*```/.test(message);
    const hasCodeIndicators =
      /function |const |let |var |class |import |export |def |async |await |return |if \(|for \(|while \(/.test(
        message
      );

    // Bug-related patterns
    const bugPatterns = [
      /fix\s+(this|my|the|a)?\s*(bug|error|issue|problem)/i,
      /why\s+(is|does|doesn't|won't|isn't)\s+/i,
      /not\s+work(ing)?/i,
      /debug/i,
      /error\s*(:|message|log)?/i,
      /crash(es|ing)?/i,
      /exception/i,
      /undefined|null\s+error/i,
      /what('?s)?\s+(wrong|the\s+issue|the\s+problem)/i,
    ];

    // Review patterns
    const reviewPatterns = [
      /review\s+(this|my)?\s*code/i,
      /check\s+(this|my)?\s*code/i,
      /improve\s+(this|my)?\s*code/i,
      /is\s+this\s+(code\s+)?(good|okay|correct|right)/i,
      /feedback\s+on/i,
      /what\s+do\s+you\s+think\s+of/i,
    ];

    // Explanation patterns
    const explainPatterns = [
      /explain\s+(this|how|what)/i,
      /how\s+does\s+(this|it)\s+work/i,
      /what\s+does\s+(this|it)\s+(do|mean)/i,
      /can\s+you\s+explain/i,
      /break\s+(this\s+)?down/i,
      /walk\s+me\s+through/i,
    ];

    // Architecture patterns
    const architecturePatterns = [
      /architect(ure)?/i,
      /design\s+(pattern|system)/i,
      /how\s+should\s+i\s+(structure|organize|design)/i,
      /best\s+(way|approach)\s+to\s+(build|implement|design)/i,
      /scalab(le|ility)/i,
      /microservice/i,
    ];

    // Refactor patterns
    const refactorPatterns = [
      /refactor/i,
      /clean\s*up/i,
      /simplify/i,
      /make\s+(this|it)\s+(better|cleaner)/i,
      /optimize/i,
    ];

    // Classify intent
    if (
      bugPatterns.some((p) => p.test(lowerMsg)) ||
      (hasCodeBlock && lowerMsg.includes("error"))
    ) {
      return { type: "bug_fix", confidence: 0.9 };
    }
    if (reviewPatterns.some((p) => p.test(lowerMsg))) {
      return { type: "code_review", confidence: 0.9 };
    }
    if (explainPatterns.some((p) => p.test(lowerMsg))) {
      return { type: "explain", confidence: 0.9 };
    }
    if (architecturePatterns.some((p) => p.test(lowerMsg))) {
      return { type: "architecture", confidence: 0.9 };
    }
    if (refactorPatterns.some((p) => p.test(lowerMsg))) {
      return { type: "refactor", confidence: 0.9 };
    }
    if (hasCodeBlock || hasCodeIndicators) {
      return { type: "code_help", confidence: 0.7 };
    }

    return { type: "general", confidence: 0.5 };
  }

  /**
   * Get the appropriate temperature for the task type
   * @param {string} intentType - The type of intent
   * @returns {number} - Temperature value
   */
  getTemperatureForIntent(intentType) {
    const temperatures = {
      bug_fix: 0.2, // Very precise for debugging
      code_review: 0.3, // Precise for analysis
      refactor: 0.3, // Precise for code changes
      explain: 0.5, // Balanced for explanations
      architecture: 0.6, // Some creativity for design
      general: 0.7, // Standard for conversation
      code_help: 0.4, // Fairly precise for code
    };
    return temperatures[intentType] || 0.7;
  }

  /**
   * Get specialized system prompt for the intent
   * @param {string} intentType - The type of intent
   * @returns {string} - The system prompt to use
   */
  getSystemPromptForIntent(intentType) {
    const prompts = {
      bug_fix: `${this.systemPrompt}\n\n${this.bugFixPrompt}`,
      code_review: `${this.systemPrompt}\n\n${this.codeReviewPrompt}`,
      refactor: `${this.systemPrompt}\n\n${this.refactorPrompt}`,
      explain: `${this.systemPrompt}\n\n${this.explainCodePrompt}`,
      architecture: `${this.systemPrompt}\n\n${this.architecturePrompt}`,
      general: this.systemPrompt,
      code_help: this.systemPrompt,
    };
    return prompts[intentType] || this.systemPrompt;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CORE API REQUEST
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Make a request to Groq API with enhanced configuration
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Object} options - Additional options (json_mode, temperature, etc.)
   */
  async makeRequest(messages, options = {}) {
    return this.makeRequestWithKey(messages, options, this.apiKey);
  }

  /**
   * Make a request to Groq API with a specific API key
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Object} options - Additional options (json_mode, temperature, etc.)
   * @param {string} apiKey - The API key to use for this request
   */
  async makeRequestWithKey(messages, options = {}, apiKey) {
    try {
      const body = {
        model: this.model,
        messages: messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens || 4096,
        top_p: options.top_p || 0.95,
      };

      if (options.jsonMode) {
        body.response_format = { type: "json_object" };
      }

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Groq API Error: ${response.status} ${response.statusText
          } - ${JSON.stringify(errorData)}`
        );
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Groq Service Error:", error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // INTELLIGENT CHAT - Routes to expert mode based on intent
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate a chat response with intelligent routing
   * @param {string} userMessage - The user's question
   * @param {string} context - Optional context
   * @param {Array} history - Optional previous messages
   */
  async chat(userMessage, context = "", history = []) {
    try {
      const lowerMsg = userMessage.toLowerCase();

      // Identity Interceptor (Enhanced)
      if (
        /who.*creat|who.*made|your.*creator|who.*built|who.*develop/i.test(
          lowerMsg
        )
      ) {
        return {
          success: true,
          message: `## 🚀 About Me

I was created by the **alpha4coders core team** during the **techSprint Hackathon**!

### The Core Team:
- **Vikash** - Lead Developer
- **Ayush** - Developer
- **Rajdeep** - Developer

I'm designed to be an elite-tier coding assistant with deep expertise in software architecture, debugging, code review, and modern development practices. How can I help you build something amazing today? 💻✨`,
          model: "identity-handler",
        };
      }

      // Enhanced Safety Filter with word boundary matching
      const sensitiveKeywords = [
        "politics",
        "election",
        "religion",
        "adult",
        "nsfw",
        "racist",
        "hate",
        "suicide",
        "kill",
        "drug",
        "violence",
      ];
      const hasSensitiveContent = sensitiveKeywords.some((keyword) => {
        // Use word boundary regex to avoid false positives (e.g., "skills" containing "kill")
        const regex = new RegExp(`\\b${keyword}\\b`, "i");
        return regex.test(lowerMsg);
      });
      if (hasSensitiveContent) {
        return {
          success: true,
          message: `## 🛡️ Staying Focused

I'm specialized as an **expert coding assistant** - my superpowers are in:

- 🐛 Bug fixing & debugging
- 🔍 Code review & analysis
- 🏗️ Architecture design
- ⚡ Performance optimization
- 🔒 Security best practices

Let's channel that energy into building something amazing! What coding challenge can I help you solve? 💻`,
          model: "safety-filter",
        };
      }

      // Detect intent and route to appropriate expert mode
      const intent = this.detectIntent(userMessage);
      const temperature = this.getTemperatureForIntent(intent.type);
      const systemPrompt = this.getSystemPromptForIntent(intent.type);

      console.log(
        `🧠 Intent detected: ${intent.type} (confidence: ${intent.confidence})`
      );

      const messages = [{ role: "system", content: systemPrompt }];

      // Add conversation history for context
      if (history && history.length > 0) {
        // Take last 10 messages for context
        const recentHistory = history.slice(-10);
        recentHistory.forEach((msg) => {
          messages.push({
            role: msg.role === "assistant" ? "assistant" : "user",
            content: msg.content,
          });
        });
      }

      // Add project context if provided
      if (context) {
        // Check if context contains memory summary
        const hasMemory = context.includes("🧠 Memory");
        messages.push({
          role: "system",
          content: hasMemory
            ? `${context}

IMPORTANT: You have persistent memory of this user from previous conversations. USE this memory to personalize your responses. When the user asks "do you remember" or similar questions, refer to what you know about them from your memory. Never say you don't have memory or can't remember - you DO have the memory shown above.`
            : `## 📋 Current Context
The user is working on:
${context}

Use this context to provide more relevant and specific assistance.`,
        });
      }

      // Add chain-of-thought instruction for complex tasks
      let enhancedMessage = userMessage;
      if (["bug_fix", "code_review", "architecture"].includes(intent.type)) {
        enhancedMessage = `${userMessage}

Think step-by-step and be thorough in your analysis.`;
      }

      messages.push({ role: "user", content: enhancedMessage });

      const responseText = await this.makeRequest(messages, {
        temperature,
        max_tokens: 4096,
      });

      return {
        success: true,
        message: responseText,
        model: this.model,
        intent: intent.type,
      };
    } catch (error) {
      console.error("Chat error:", error);
      return {
        success: false,
        error:
          "AI assistant is currently unavailable. Please check your connection or API key.",
        details: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPERT BUG FIXING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Expert bug analysis and fix suggestions
   * @param {string} code - The problematic code
   * @param {string} errorMessage - The error message or description
   * @param {string} language - Programming language
   */
  async fixBug(code, errorMessage, language = "javascript") {
    const prompt = `## 🐛 Bug Report

### Error/Problem:
${errorMessage}

### Code with the bug:
\`\`\`${language}
${code}
\`\`\`

Please analyze this code and provide:
1. **Root Cause**: WHY this bug occurs
2. **The Fix**: Corrected code with explanations
3. **Prevention**: How to avoid this in the future
4. **Edge Cases**: Any related issues to watch for`;

    try {
      const messages = [
        {
          role: "system",
          content: `${this.systemPrompt}\n\n${this.bugFixPrompt}`,
        },
        { role: "user", content: prompt },
      ];

      const response = await this.makeRequest(messages, {
        temperature: 0.2,
        max_tokens: 4096,
      });

      return {
        success: true,
        analysis: response,
        model: this.model,
      };
    } catch (error) {
      console.error("Bug fix error:", error);
      return {
        success: false,
        error: "Bug analysis failed. Please try again.",
        details: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPERT CODE REVIEW
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Comprehensive code review with quality scoring
   * @param {string} code - The code to review
   * @param {string} language - Programming language
   * @param {object} options - Additional options (focus areas, etc.)
   */
  async reviewCode(code, language = "javascript", options = {}) {
    const focusArea = options.focus || "all";

    let focusInstruction = "";
    switch (focusArea) {
      case "security":
        focusInstruction =
          "Focus especially on security vulnerabilities (OWASP Top 10, input validation, auth issues).";
        break;
      case "performance":
        focusInstruction =
          "Focus especially on performance (time complexity, memory usage, optimization opportunities).";
        break;
      case "readability":
        focusInstruction =
          "Focus especially on readability (naming, structure, documentation, maintainability).";
        break;
      default:
        focusInstruction =
          "Provide a comprehensive review covering all aspects.";
    }

    const prompt = `## 📝 Code Review Request

### Language: ${language}
### Focus: ${focusArea.charAt(0).toUpperCase() + focusArea.slice(1)}

${focusInstruction}

### Code to Review:
\`\`\`${language}
${code}
\`\`\`

Provide a thorough multi-pass review following the FAANG-level code review format.`;

    try {
      const messages = [
        {
          role: "system",
          content: `${this.systemPrompt}\n\n${this.codeReviewPrompt}`,
        },
        { role: "user", content: prompt },
      ];

      const review = await this.makeRequest(messages, {
        temperature: 0.3,
        max_tokens: 4096,
      });

      return {
        success: true,
        review: review,
        model: this.model,
        focusArea: focusArea,
      };
    } catch (error) {
      console.error("Code review error:", error);
      return {
        success: false,
        error: "Code review failed. Please try again.",
        details: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPERT RESUME SUMMARY GENERATOR
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate a professional resume summary based on user profile and verified projects
   * @param {object} userData - User profile data (role, bio, experience)
   * @param {Array} projects - List of user's key projects
   * @param {Array} skills - List of verified skills
   */
  async generateResumeSummary(userData, projects, skills) {
    const projectHighlights = projects.slice(0, 3).map(p =>
      `- ${p.name}: ${p.description} (Tech: ${p.technologies?.join(', ')})`
    ).join('\n');

    const prompt = `You are a Professional Resume Writer for top-tier tech companies (Google, Meta, Netflix).
    
    Write a concise, high-impact professional summary (3-4 sentences max) for a software developer's resume.
    
    **CANDIDATE PROFILE:**
    - Role: ${userData.role || 'Full Stack Developer'}
    - Key Skills: ${skills.map(s => s.name).join(', ')}
    - Experience Level: ${userData.experience?.length || 0} previous roles
    
    **KEY PROJECTS:**
    ${projectHighlights}
    
    **INSTRUCTIONS:**
    1. Use active voice and strong action verbs.
    2. Highlight technical expertise and problem-solving abilities.
    3. Mention specific high-impact technologies from their stack.
    4. Do NOT use personal pronouns like "I", "me", "my". Start sentences with verbs or adjectives.
    5. Output ONLY the summary text, no headings or other formatting.`;

    try {
      const messages = [
        {
          role: "system",
          content: "You are an expert resume consultant who writes compelling, ATS-friendly professional summaries."
        },
        { role: "user", content: prompt }
      ];

      const summary = await this.makeRequest(messages, {
        temperature: 0.6,
        max_tokens: 200
      });

      return {
        success: true,
        summary: summary.trim()
      };
    } catch (error) {
      console.error("Resume summary generation error:", error);
      return {
        success: false,
        error: "Failed to generate summary.",
        details: error.message
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // EXPERT PROJECT ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Analyze project progress with comprehensive output
   * @param {object} repoInfo - Complete repository information from GitHub
   */
  async analyzeProjectProgress(repoInfo) {
    // Format key files for the prompt
    const keyFilesSection =
      repoInfo.keyFiles && Object.keys(repoInfo.keyFiles).length > 0
        ? Object.entries(repoInfo.keyFiles)
          .map(
            ([filename, content]) =>
              `### ${filename}\n\`\`\`\n${content.substring(0, 1200)}\n\`\`\``
          )
          .join("\n\n")
        : "No key configuration files found";

    // Format commit patterns
    const commitPatternSection = repoInfo.commitStats?.commitPatterns
      ? `
- 🚀 Feature commits: ${repoInfo.commitStats.commitPatterns.features}
- 🐛 Bug fix commits: ${repoInfo.commitStats.commitPatterns.fixes}
- 📚 Documentation commits: ${repoInfo.commitStats.commitPatterns.docs}
- ♻️ Refactoring commits: ${repoInfo.commitStats.commitPatterns.refactors}
- 🧪 Test commits: ${repoInfo.commitStats.commitPatterns.tests}
- 📦 Other commits: ${repoInfo.commitStats.commitPatterns.other}`
      : "Commit pattern analysis not available";

    // Enhanced analysis prompt
    const prompt = `You are a **Senior Technical Architect** conducting a comprehensive project analysis.

═══════════════════════════════════════════════════════════════════════════════
ANALYSIS METHODOLOGY
═══════════════════════════════════════════════════════════════════════════════

Calculate progress by evaluating:
1. **Architecture Maturity** (25%): Code organization, patterns, separation of concerns
2. **Feature Completeness** (25%): Core features implemented vs obvious gaps
3. **Code Quality** (20%): Tests, documentation, error handling, types
4. **DevOps Readiness** (15%): CI/CD, Docker, environment configs
5. **Technical Debt** (15%): Code smells, outdated deps, hacky workarounds

═══════════════════════════════════════════════════════════════════════════════
REPOSITORY INTEL
═══════════════════════════════════════════════════════════════════════════════

📊 **METRICS:**
- Name: ${repoInfo.name}
- Description: ${repoInfo.description || "No description"}
- Primary Language: ${repoInfo.primaryLanguage || "Unknown"}
- Languages: ${repoInfo.languages
        ?.map((l) => `${l.name} (${l.percentage}%)`)
        .join(", ") || "None"
      }
- Total Commits: ${repoInfo.totalCommits || 0}
- Commits This Week: ${repoInfo.recentCommitsThisWeek || 0}
- Stars: ${repoInfo.stars || 0} ⭐ | Forks: ${repoInfo.forks || 0} 🍴
- Open Issues: ${repoInfo.openIssues?.length || 0}
- Open PRs: ${repoInfo.openPullRequests?.length || 0}
- Size: ${repoInfo.size || 0} KB
- Created: ${repoInfo.createdAt || "Unknown"}
- Last Push: ${repoInfo.pushedAt || "Unknown"}
- Topics: ${repoInfo.topics?.join(", ") || "None"}
- Visibility: ${repoInfo.isPrivate ? "🔒 Private" : "🌐 Public"}

📈 **COMMIT PATTERNS:**
${commitPatternSection}

📝 **RECENT COMMITS (last 30):**
${repoInfo.commits
        ?.slice(0, 30)
        .map(
          (c) => `- [${c.date?.split("T")[0] || "?"}] ${c.message.substring(0, 80)}`
        )
        .join("\n") || "No commits"
      }

🎫 **OPEN ISSUES:**
${repoInfo.openIssues
        ?.slice(0, 15)
        .map(
          (i) =>
            `- #${i.number}: ${i.title} [${i.labels?.join(", ") || "no labels"}]`
        )
        .join("\n") || "No open issues"
      }

🔀 **OPEN PRs:**
${repoInfo.openPullRequests
        ?.slice(0, 8)
        .map((p) => `- #${p.number}: ${p.title}`)
        .join("\n") || "No open PRs"
      }

📁 **DIRECTORY STRUCTURE:**
${repoInfo.directoryStructure
        ?.map((d) => {
          const icon = d.type === "dir" ? "📁" : "📄";
          return `- ${icon} ${d.name}${d.type === "dir" ? "/" : ""}`;
        })
        .join("\n") || "Unknown"
      }

📄 **KEY FILES:**
${keyFilesSection}

📖 **README:**
${repoInfo.readme?.substring(0, 1000) || "No README found"}

═══════════════════════════════════════════════════════════════════════════════
REQUIRED OUTPUT (JSON)
═══════════════════════════════════════════════════════════════════════════════

Respond with this EXACT JSON structure:
{
  "progressSummary": "<2-3 sentence expert summary of what's built and what's remaining>",
  "progressPercentage": <0-100, calculated using the methodology above>,
  "healthScore": <0-100, overall project health>,
  "commitFrequencyScore": <0-100>,
  "productivityStreaks": {
    "currentStreak": <consecutive active days>,
    "assessment": "<brief assessment>"
  },
  "architectureAssessment": {
    "score": <0-100>,
    "pattern": "<detected architecture pattern>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "concerns": ["<concern 1>", "<concern 2>"]
  },
  "techStack": {
    "detected": ["<tech 1>", "<tech 2>"],
    "recommendations": ["<optional tech recommendation>"]
  },
  "areasOfImprovement": [
    "<specific, actionable improvement 1>",
    "<specific improvement 2>",
    "<specific improvement 3>"
  ],
  "nextRecommendedTasks": [
    {"task": "<specific task>", "priority": "high|medium|low", "impact": "<why it matters>"},
    {"task": "<specific task>", "priority": "high|medium|low", "impact": "<why it matters>"},
    {"task": "<specific task>", "priority": "high|medium|low", "impact": "<why it matters>"}
  ],
  "fileAnalysis": [
    {"area": "<folder/area>", "status": "active|stale|needs-attention", "note": "<brief note>"}
  ],
  "codeQuality": {
    "hasTests": <true|false>,
    "testCoverage": "<none|minimal|partial|good|excellent>",
    "hasDocumentation": <true|false>,
    "hasCI": <true|false>,
    "hasDocker": <true|false>,
    "typeSafety": "<none|partial|full>",
    "configurationMaturity": "basic|intermediate|advanced"
  },
  "technicalDebt": {
    "level": "low|medium|high|critical",
    "items": ["<debt item 1>", "<debt item 2>"]
  },
  "trends": "<observation about development velocity and patterns>",
  "concerns": "<any blockers, risks, or red flags>",
  "expertTip": "<one actionable pro tip specific to this project>"
}`;

    try {
      const messages = [
        {
          role: "system",
          content: `You are a Senior Technical Architect with 15+ years of experience. Analyze projects with the precision of a tech lead at a FAANG company. Be specific, actionable, and insightful. Always respond with valid JSON only.`,
        },
        { role: "user", content: prompt },
      ];

      const jsonResponse = await this.makeRequest(messages, {
        jsonMode: true,
        max_tokens: 3500,
        temperature: 0.3,
      });

      const parsed = JSON.parse(jsonResponse);

      console.log("✅ AI Expert Project Analysis complete");

      return {
        success: true,
        ...parsed,
      };
    } catch (error) {
      console.error("Project analysis error:", error);
      return {
        success: false,
        progressSummary: "Analysis temporarily unavailable",
        progressPercentage: 0,
        healthScore: 0,
        commitFrequencyScore: 0,
        areasOfImprovement: [],
        nextRecommendedTasks: [],
        error: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CODE EXPLANATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Explain code in detail for learning
   * @param {string} code - The code to explain
   * @param {string} language - Programming language
   */
  async explainCode(code, language = "javascript") {
    const prompt = `## 📖 Code Explanation Request

Please explain this ${language} code in detail:

\`\`\`${language}
${code}
\`\`\`

Walk through it step-by-step, explain any patterns or techniques used, and highlight anything tricky or noteworthy.`;

    try {
      const messages = [
        {
          role: "system",
          content: `${this.systemPrompt}\n\n${this.explainCodePrompt}`,
        },
        { role: "user", content: prompt },
      ];

      const explanation = await this.makeRequest(messages, {
        temperature: 0.5,
        max_tokens: 4096,
      });

      return {
        success: true,
        explanation: explanation,
        model: this.model,
      };
    } catch (error) {
      console.error("Code explanation error:", error);
      return {
        success: false,
        error: "Explanation failed. Please try again.",
        details: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CODE REFACTORING
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Suggest and apply refactoring improvements
   * @param {string} code - The code to refactor
   * @param {string} language - Programming language
   * @param {string} goal - Optional specific refactoring goal
   */
  async refactorCode(code, language = "javascript", goal = "") {
    const goalInstruction = goal
      ? `Specific goal: ${goal}`
      : "Apply best practices to improve this code.";

    const prompt = `## 🔄 Refactoring Request

${goalInstruction}

### Code to refactor:
\`\`\`${language}
${code}
\`\`\`

Provide the refactored version with detailed explanations of each change and why it improves the code.`;

    try {
      const messages = [
        {
          role: "system",
          content: `${this.systemPrompt}\n\n${this.refactorPrompt}`,
        },
        { role: "user", content: prompt },
      ];

      const refactored = await this.makeRequest(messages, {
        temperature: 0.3,
        max_tokens: 4096,
      });

      return {
        success: true,
        refactored: refactored,
        model: this.model,
      };
    } catch (error) {
      console.error("Refactoring error:", error);
      return {
        success: false,
        error: "Refactoring failed. Please try again.",
        details: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MOTIVATIONAL MESSAGE
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate an encouraging motivational message
   * @param {object} stats - Developer stats
   */
  async generateMotivation(stats) {
    const prompt = `Generate a SHORT (2-3 sentences max) motivational message for a developer.

Their stats:
- Days active: ${stats.daysActive || 0}
- Total commits: ${stats.commits || 0}
- Current streak: ${stats.streak || 0} days

Be genuine, encouraging, and specific to their activity level. Add a relevant emoji.`;

    try {
      const messages = [
        {
          role: "system",
          content:
            "You are an encouraging mentor. Keep responses SHORT (2-3 sentences). Be genuine and uplifting.",
        },
        { role: "user", content: prompt },
      ];

      return await this.makeRequest(messages, {
        max_tokens: 100,
        temperature: 0.8,
      });
    } catch (error) {
      console.error("Motivation error:", error);
      return "Every commit is progress! Keep building, keep learning. 🚀";
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SECURITY AUDIT
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Perform a security audit on code
   * @param {string} code - The code to audit
   * @param {string} language - Programming language
   */
  async securityAudit(code, language = "javascript") {
    const prompt = `## 🔒 Security Audit Request

Perform a comprehensive security audit on this ${language} code:

\`\`\`${language}
${code}
\`\`\`

Check for:
1. **OWASP Top 10** vulnerabilities
2. **Input validation** issues
3. **Authentication/Authorization** flaws
4. **Data exposure** risks
5. **Injection** vulnerabilities (SQL, XSS, Command, etc.)
6. **Secrets/Credentials** in code
7. **Insecure dependencies** patterns

For each issue found, provide:
- Severity (Critical/High/Medium/Low)
- The vulnerable code
- The secure fix
- Prevention strategy`;

    try {
      const messages = [
        {
          role: "system",
          content: `${this.systemPrompt}

You are a cybersecurity expert. Be thorough and precise in identifying vulnerabilities. Provide actionable fixes for every issue found.`,
        },
        { role: "user", content: prompt },
      ];

      const audit = await this.makeRequest(messages, {
        temperature: 0.2,
        max_tokens: 4096,
      });

      return {
        success: true,
        audit: audit,
        model: this.model,
      };
    } catch (error) {
      console.error("Security audit error:", error);
      return {
        success: false,
        error: "Security audit failed. Please try again.",
        details: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CONVERSATION MEMORY SUMMARIZATION
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Summarize a conversation to create persistent memory
   * @param {Array} messages - Array of conversation messages
   * @param {string} existingSummary - Previous summary to incorporate
   * @returns {object} - Summary result
   */
  async summarizeConversation(messages, existingSummary = "") {
    if (!messages || messages.length === 0) {
      return {
        success: true,
        summary: existingSummary || "",
      };
    }

    const conversationText = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const prompt = `You are creating a MEMORY SUMMARY for a coding assistant. This summary will be used to remember key information about the user across conversations.

${existingSummary ? `## Previous Memory:\n${existingSummary}\n\n---\n\n` : ""}

## New Conversation to Summarize:
${conversationText}

---

Create a concise memory summary that captures:
1. **User Profile**: Their name (if mentioned), skill level, role, interests
2. **Projects**: What projects they're working on, tech stacks used
3. **Topics Discussed**: Key coding topics, problems solved, concepts learned
4. **Preferences**: Their coding style preferences, preferred technologies
5. **Important Context**: Any deadlines, goals, or important details mentioned

**FORMAT YOUR RESPONSE AS A SINGLE PARAGRAPH** (max 500 words) that can be used to quickly recall who this user is and what they've discussed. Write in third person (e.g., "The user is working on...").

If the previous memory exists, MERGE the new information with it, keeping the most relevant and recent details. Remove outdated information.`;

    try {
      const response = await this.makeRequest(
        [
          {
            role: "system",
            content:
              "You are a memory summarization expert. Create concise, useful summaries that capture the essence of conversations for future reference.",
          },
          { role: "user", content: prompt },
        ],
        {
          temperature: 0.3,
          max_tokens: 800,
        }
      );

      return {
        success: true,
        summary: response.trim(),
        model: this.model,
      };
    } catch (error) {
      console.error("Summarization error:", error);
      return {
        success: false,
        error: "Failed to summarize conversation",
        summary: existingSummary || "",
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PROJECT IDEAS GENERATOR
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate personalized project ideas based on user's skills
   * @param {object} skillProfile - User's skill profile
   * @param {string[]} skillProfile.primarySkills - Most used skills
   * @param {string[]} skillProfile.recentSkills - Recently learned skills
   * @param {string[]} skillProfile.projectTypes - Types of projects completed
   * @param {string} difficulty - beginner, intermediate, or advanced
   * @param {string[]} excludeTitles - Previously shown project titles to avoid
   */
  async generateProjectIdeas(
    skillProfile,
    difficulty = "intermediate",
    excludeTitles = []
  ) {
    const difficultyGuide = {
      beginner:
        "Simple projects achievable in 1-2 weeks, focusing on fundamentals",
      intermediate:
        "Moderate complexity projects for 2-4 weeks, introducing new concepts",
      advanced:
        "Complex projects for 4-8 weeks, involving system design and advanced patterns",
    };

    const prompt = `## 🎯 Project Ideas Generator

Based on this developer's profile, generate 5 unique and exciting project ideas.

### Developer Profile:
- **Primary Skills**: ${skillProfile.primarySkills?.join(", ") || "General programming"
      }
- **Recently Learning**: ${skillProfile.recentSkills?.join(", ") || "Various technologies"
      }
- **Completed Project Types**: ${skillProfile.projectTypes?.join(", ") || "Various projects"
      }

${excludeTitles.length > 0
        ? `### ⚠️ EXCLUDED PROJECTS (DO NOT SUGGEST THESE OR SIMILAR):
The following projects have already been shown. DO NOT generate these or any variations of them:
${excludeTitles.map((t) => `- ${t}`).join("\n")}

Generate COMPLETELY DIFFERENT and UNIQUE project ideas.

`
        : ""
      }### Requirements:
- **Difficulty Level**: ${difficulty} - ${difficultyGuide[difficulty] || difficultyGuide.intermediate
      }
- Each project should BUILD ON existing skills while introducing 1-2 new technologies
- Projects should be practical and portfolio-worthy
- Include a mix of categories (web app, tool, API, etc.)
- MUST be unique and different from excluded projects above

### Output Format (JSON):
Return ONLY valid JSON in this exact structure:
{
  "ideas": [
    {
      "title": "Project Name",
      "description": "2-3 sentence description of what it does and why it's useful",
      "techStack": ["Tech1", "Tech2", "Tech3"],
      "newSkillsToLearn": ["New skill 1", "New skill 2"],
      "difficulty": "${difficulty}",
      "estimatedHours": 40,
      "learningOutcomes": ["What you'll learn 1", "What you'll learn 2"],
      "category": "Web App | CLI Tool | API | Mobile | Game | DevTool"
    }
  ]
}

Generate exactly 5 project ideas. Return ONLY the JSON, no other text.`;

    try {
      const messages = [
        {
          role: "system",
          content: `You are a senior developer mentor who suggests practical, engaging project ideas. 
Your suggestions are always:
- Relevant to the developer's current skills
- Challenging but achievable
- Portfolio-worthy and practical
- Designed to teach valuable new skills

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation, just the JSON object.`,
        },
        { role: "user", content: prompt },
      ];

      const response = await this.makeRequest(messages, {
        temperature: 0.8,
        max_tokens: 3000,
        jsonMode: true,
      });

      // Parse the JSON response
      let ideas;
      try {
        ideas = JSON.parse(response);
      } catch (parseError) {
        // Try to extract JSON if wrapped in markdown
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          ideas = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse AI response as JSON");
        }
      }

      return {
        success: true,
        ideas: ideas.ideas || [],
        model: this.model,
      };
    } catch (error) {
      console.error("Project ideas generation error:", error);
      return {
        success: false,
        error: "Failed to generate project ideas. Please try again.",
        details: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // README GENERATOR
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Generate a professional README.md for a project
   * @param {object} repoInfo - Complete repository information from GitHub
   * @returns {object} - Generated README content
   */
  async generateReadme(repoInfo) {
    // Format key files for context
    const keyFilesSection =
      repoInfo.keyFiles && Object.keys(repoInfo.keyFiles).length > 0
        ? Object.entries(repoInfo.keyFiles)
          .map(
            ([filename, content]) =>
              `### ${filename}\n\`\`\`\n${content.substring(0, 1500)}\n\`\`\``
          )
          .join("\n\n")
        : "No configuration files found";

    // Format directory structure
    const structureSection =
      repoInfo.directoryStructure
        ?.slice(0, 20)
        .map((d) => {
          const icon = d.type === "dir" ? "📁" : "📄";
          return `${icon} ${d.name}${d.type === "dir" ? "/" : ""}`;
        })
        .join("\n") || "Structure not available";

    // Format languages
    const languagesInfo =
      repoInfo.languages
        ?.map((l) => `${l.name} (${l.percentage}%)`)
        .join(", ") || "Not detected";

    const prompt = `You are an expert technical writer. Generate a professional, comprehensive README.md for this GitHub repository.

═══════════════════════════════════════════════════════════════════════════════
REPOSITORY INFORMATION
═══════════════════════════════════════════════════════════════════════════════

📊 **BASIC INFO:**
- Repository Name: ${repoInfo.name}
- Description: ${repoInfo.description || "No description provided"}
- Primary Language: ${repoInfo.primaryLanguage || "Unknown"}
- All Languages: ${languagesInfo}
- Stars: ${repoInfo.stars || 0} | Forks: ${repoInfo.forks || 0}
- Topics/Tags: ${repoInfo.topics?.join(", ") || "None"}
- Created: ${repoInfo.createdAt || "Unknown"}
- Last Updated: ${repoInfo.pushedAt || "Unknown"}
- License: ${repoInfo.license || "Not specified"}

📁 **DIRECTORY STRUCTURE:**
${structureSection}

📄 **KEY CONFIGURATION FILES:**
${keyFilesSection}

📝 **RECENT COMMITS (for understanding project focus):**
${repoInfo.commits
        ?.slice(0, 15)
        .map((c) => `- ${c.message.substring(0, 100)}`)
        .join("\n") || "No commits available"
      }

═══════════════════════════════════════════════════════════════════════════════
README GENERATION REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

Generate a README.md with these PREMIUM PROFESSIONAL sections:

═══════════════════════════════════════════════════════════════════════════════
SECTION 1: HERO HEADER (STUNNING FIRST IMPRESSION)
═══════════════════════════════════════════════════════════════════════════════
- Use centered HTML layout: \`<div align="center">\`
- Structure:
  1. Project title as \`<h1>\` with emoji prefix matching project type
  2. One-line tagline in \`<p>\` with italic styling
  3. Badge row with shields.io (style=for-the-badge for prominence):
     - ![Build](https://img.shields.io/badge/build-passing-brightgreen?style=for-the-badge)
     - ![Version](https://img.shields.io/badge/version-X.X.X-blue?style=for-the-badge) (from package.json)
     - ![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge) (detect from LICENSE)
     - Language badge with logo
  4. Close with \`</div>\`

═══════════════════════════════════════════════════════════════════════════════
SECTION 2: TABLE OF CONTENTS (PROFESSIONAL NAVIGATION)
═══════════════════════════════════════════════════════════════════════════════
- Use a clean, professional format with proper GitHub anchor links
- Wrap in collapsible details tag (open by default)
- Use TWO-COLUMN TABLE layout for compact navigation:

\`\`\`html
<details open>
<summary><b>🗺️ Table of Contents</b></summary>

| Section | Description |
|:--------|:------------|
| [✨ Features](#-features) | What this project offers |
| [🛠️ Tech Stack](#️-tech-stack) | Technologies used |
| [🚀 Getting Started](#-getting-started) | Setup instructions |
| [📖 Usage](#-usage) | How to use |
| [📁 Project Structure](#-project-structure) | Codebase organization |
| [🔌 API Reference](#-api-reference) | Endpoints documentation |
| [🤝 Contributing](#-contributing) | How to contribute |
| [📄 License](#-license) | License info |

</details>
\`\`\`

- **CRITICAL**: Use EXACT anchor format that GitHub generates:
  * Emoji sections: \`#-features\` (dash before word)
  * Multi-word: \`#getting-started\` (lowercase, hyphenated)
  * Special chars removed from anchors

═══════════════════════════════════════════════════════════════════════════════
SECTION 3: DESCRIPTION (COMPELLING NARRATIVE)
═══════════════════════════════════════════════════════════════════════════════
- 2-3 impactful sentences explaining:
  * WHAT the project does (core functionality)
  * WHO it's for (target users)
  * WHY it matters (key benefit/problem solved)
- Add "Key Highlights" as a compact bullet list:
  \`\`\`
  > 🎯 **Key Highlights**
  > - ⚡ Fast and lightweight
  > - 🔒 Secure authentication
  > - 📱 Responsive design
  \`\`\`

═══════════════════════════════════════════════════════════════════════════════
SECTION 4: FEATURES (VISUAL FEATURE GRID)
═══════════════════════════════════════════════════════════════════════════════
- Use a visually appealing table with category icons:
  | | Feature | Description |
  |:--:|---------|-------------|
  | 🎨 | **Modern UI** | Beautiful, responsive interface built with React |
  | 🔐 | **Secure Auth** | JWT-based authentication with Clerk |
  | 📊 | **Analytics** | Real-time dashboard with charts |
  | 🚀 | **Fast API** | Express.js REST API with optimized queries |
- **ACCURACY**: Only list features evidenced by actual files/dependencies
- Group by category if many features (Core, Developer Experience, Security)

═══════════════════════════════════════════════════════════════════════════════
SECTION 5: TECH STACK (BADGE ARCHITECTURE)
═══════════════════════════════════════════════════════════════════════════════
- Organize by layer with emoji subheadings
- Use shields.io badges with \`style=for-the-badge\` and correct logo slugs:

**🎨 Frontend**
\`\`\`
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
\`\`\`

**⚙️ Backend**
\`\`\`
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
\`\`\`

**🗄️ Database**
\`\`\`
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
\`\`\`

- **CRITICAL ACCURACY**:
  * Parse EXACT versions from package.json
  * Use correct logo slugs (nodedotjs, tailwind-css, etc.)
  * Only include actually-used technologies

═══════════════════════════════════════════════════════════════════════════════
SECTION 6: GETTING STARTED (STEP-BY-STEP GUIDE)
═══════════════════════════════════════════════════════════════════════════════

### Prerequisites
List with version badges:
\`\`\`
- ![Node.js](https://img.shields.io/badge/Node.js->=18.0-339933?logo=nodedotjs) 
- ![npm](https://img.shields.io/badge/npm->=9.0-CB3837?logo=npm)
- ![MongoDB](https://img.shields.io/badge/MongoDB->=6.0-47A248?logo=mongodb)
\`\`\`

### Installation
Use numbered steps with code blocks:
\`\`\`markdown
1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/username/repo.git
   cd repo
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   # Install client dependencies
   cd client && npm install
   
   # Install server dependencies
   cd ../server && npm install
   \`\`\`

3. **Configure environment**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your values
   \`\`\`
\`\`\`

### Environment Variables
Professional collapsible table:
\`\`\`html
<details>
<summary>🔐 Environment Configuration</summary>

#### Required
| Variable | Description | Example |
|:---------|:------------|:--------|
| \`MONGODB_URI\` | Database connection | \`mongodb://localhost:27017/app\` |
| \`CLERK_SECRET_KEY\` | Auth provider key | \`sk_test_xxxxx\` |

#### Optional
| Variable | Description | Default |
|:---------|:------------|:--------|
| \`PORT\` | Server port | \`3000\` |
| \`NODE_ENV\` | Environment | \`development\` |

> 📝 See \`.env.example\` for all variables

</details>
\`\`\`

### Quick Start
Single command block:
\`\`\`bash
# Start both client and server
npm run dev
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
SECTION 7: USAGE (PRACTICAL EXAMPLES)
═══════════════════════════════════════════════════════════════════════════════
- Show ACTUAL scripts from package.json:
\`\`\`bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build optimized bundle
npm run start        # Start production server

# Testing
npm run test         # Run test suite
npm run test:watch   # Watch mode
\`\`\`

- If API present, show curl example:
\`\`\`bash
# Example: Get all users
curl http://localhost:3000/api/users
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
SECTION 8: PROJECT STRUCTURE (ARCHITECTURE OVERVIEW)
═══════════════════════════════════════════════════════════════════════════════
- Wrap in \`\`\`text code block
- Use emojis: 📦 root, 📂 folder, 📄 file
- 3-4 levels deep with inline comments
- Adapt to ACTUAL project structure:

\`\`\`text
📦 project-root
│
├── 📂 client/                      # React Frontend
│   ├── 📂 src/
│   │   ├── 📂 components/          # UI Components
│   │   │   ├── 📂 ui/              # Base components
│   │   │   └── 📂 features/        # Feature modules
│   │   ├── 📂 pages/               # Route pages
│   │   ├── 📂 hooks/               # Custom hooks
│   │   ├── 📂 services/            # API layer
│   │   ├── 📂 utils/               # Utilities
│   │   └── 📄 main.jsx             # Entry point
│   ├── 📄 package.json
│   ├── 📄 vite.config.js
│   └── 📄 tailwind.config.js
│
├── 📂 server/                      # Express Backend
│   ├── 📂 src/
│   │   ├── 📂 controllers/         # Request handlers
│   │   ├── 📂 middleware/          # Auth, validation
│   │   ├── 📂 models/              # Database schemas
│   │   ├── 📂 routes/              # API routes
│   │   ├── 📂 services/            # Business logic
│   │   ├── � utils/               # Helpers
│   │   └── 📄 app.js               # App setup
│   ├── 📄 package.json
│   └── 📄 .env.example
├── 📄 README.md
└── 📄 .gitignore
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
SECTION 9: API REFERENCE (IF APPLICABLE)
═══════════════════════════════════════════════════════════════════════════════
- Use a markdown table with method badges:
  | Method | Endpoint | Description | Auth |
  |:-------|:---------|:------------|:----:|
  | ![GET](https://img.shields.io/badge/GET-blue) | \`/api/projects\` | Get all projects | 🔒 |
  | ![POST](https://img.shields.io/badge/POST-green) | \`/api/projects\` | Create project | 🔒 |
- Only generate if you definitely see API routes/controllers

═══════════════════════════════════════════════════════════════════════════════
SECTION 10: CONTRIBUTING (WELCOMING)
═══════════════════════════════════════════════════════════════════════════════
Friendly contribution guide:

\`\`\`markdown
Contributions are welcome! 🎉

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
SECTION 11: LICENSE
═══════════════════════════════════════════════════════════════════════════════
- State license with badge:
\`\`\`markdown
Distributed under the MIT License. See \`LICENSE\` for more information.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
SECTION 12: FOOTER (PROFESSIONAL CLOSE)
═══════════════════════════════════════════════════════════════════════════════
- Horizontal rule
- Centered "Made with ❤️" or project link
- Optional: Star badge call-to-action

\`\`\`html
---
<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/username">Your Name</a></p>
  <p>⭐ Star this repo if you find it useful!</p>
</div>
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
CRITICAL ACCURACY RULES
═══════════════════════════════════════════════════════════════════════════════
- **NO HALLUCINATIONS**: Only list features/tech visible in code
- **VERIFY EVERYTHING**: Cross-check with package.json, file structure
- **EXACT VERSIONS**: Parse from dependencies, not guessed
- **REAL COMMANDS**: Use actual scripts from package.json
- **PROJECT SPECIFIC**: Tailor every section to THIS project

Generate the README.md now:`;

    try {
      const messages = [
        {
          role: "system",
          content: `You are a senior technical writer who creates exceptional README documentation. 
Your READMEs are:
- Clear and well-organized
- Specific to the project (not generic)
- Visually appealing with good use of markdown
- Practical with real commands and examples
- Professional yet approachable

Return ONLY raw Markdown content. Do not wrap in code blocks or add explanations.`,
        },
        { role: "user", content: prompt },
      ];

      const readme = await this.makeRequestWithKey(messages, {
        temperature: 0.4,
        max_tokens: 4096,
      }, process.env.GROQ_README_API_KEY || this.apiKey);

      // Clean up the response - remove any markdown code block wrappers
      let cleanReadme = readme.trim();
      if (cleanReadme.startsWith("```markdown")) {
        cleanReadme = cleanReadme.slice(11);
      } else if (cleanReadme.startsWith("```md")) {
        cleanReadme = cleanReadme.slice(5);
      } else if (cleanReadme.startsWith("```")) {
        cleanReadme = cleanReadme.slice(3);
      }
      if (cleanReadme.endsWith("```")) {
        cleanReadme = cleanReadme.slice(0, -3);
      }
      cleanReadme = cleanReadme.trim();

      console.log("✅ README generated successfully");

      return {
        success: true,
        readme: cleanReadme,
        model: this.model,
      };
    } catch (error) {
      console.error("README generation error:", error);

      // Handle rate limits specifically
      if (error.status === 429 || error.message?.includes('429')) {
        return {
          success: false,
          error: "Rate limit exceeded. Please wait a moment before trying again.",
          details: error.message
        };
      }

      return {
        success: false,
        error: "Failed to generate README. Please try again.",
        details: error.message,
      };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SIMILAR PROJECTS ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Analyze user's repositories and READMEs to extract search keywords
   * for finding public repos with similar README content and features
   * @param {object[]} repos - Array of user's repos with details
   * @param {string[]} readmeContents - Array of README content strings
   * @returns {object} - Extracted keywords for searching similar READMEs
   */
  async analyzeReposForSimilarProjects(repos, readmeContents = []) {
    // Build context from repos
    const repoSummaries = repos.slice(0, 5).map(repo => {
      return `- ${repo.name}: ${repo.description || 'No description'} (${repo.language || 'Unknown'})${repo.topics?.length > 0 ? ` [Topics: ${repo.topics.join(', ')}]` : ''}`;
    }).join('\n');

    // Combine README snippets - prioritize README content for analysis
    const readmeContext = readmeContents
      .filter(r => r)
      .slice(0, 3)
      .map((r, i) => `### README ${i + 1}:\n${r.substring(0, 1500)}`)
      .join('\n\n---\n\n');

    const prompt = `You are an expert at analyzing software project documentation. Your goal is to deeply analyze the user's README files and extract keywords that will help find PUBLIC repositories with SIMILAR README content, features, and project structure on GitHub.

## User's Repositories:
${repoSummaries}

${readmeContext ? `## README Content (ANALYZE THIS CAREFULLY):\n${readmeContext}` : ''}

## Task:
Analyze the README content thoroughly and extract:

1. **Core Features** - What features are described in the README? (e.g., "real-time chat", "user authentication", "data visualization", "REST API", "CRUD operations")

2. **Tech Stack Keywords** - Specific technologies mentioned in README (e.g., "React hooks", "Express middleware", "MongoDB aggregation", "JWT authentication")

3. **Project Purpose** - What problem does this project solve? (e.g., "task management", "developer productivity", "e-commerce platform", "social network")

4. **README Patterns** - Common sections/patterns in the README (e.g., "API documentation", "installation guide", "docker setup", "testing framework")

5. **Search Terms** - The BEST keywords to find similar public repos with matching README content

Return ONLY valid JSON in this exact format:
{
  "coreFeatures": ["real-time updates", "user authentication", "dashboard analytics"],
  "techStackKeywords": ["React", "Node.js", "MongoDB", "Socket.io"],
  "projectPurpose": ["task management", "productivity tool", "developer dashboard"],
  "readmePatterns": ["API docs", "docker setup", "CI/CD"],
  "searchTerms": ["fullstack", "mern-stack", "real-time", "dashboard"],
  "suggestedSearchQuery": "mern stack dashboard real-time analytics"
}

Focus on extracting terms that describe WHAT the project DOES, not just what technologies it uses. This helps find repos with similar functionality and README structure.

Return ONLY the JSON, no other text.`;

    try {
      const messages = [
        {
          role: "system",
          content: "You are a README analysis expert. Extract meaningful keywords from README content to find similar projects. Focus on project features, purpose, and functionality - not just technologies. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ];

      const response = await this.makeRequest(messages, {
        temperature: 0.3,
        max_tokens: 1200,
        jsonMode: true,
      });

      // Parse the JSON response
      let analysis;
      try {
        analysis = JSON.parse(response);
      } catch (parseError) {
        // Try to extract JSON if wrapped in markdown
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Failed to parse AI response as JSON");
        }
      }

      return {
        success: true,
        coreFeatures: analysis.coreFeatures || [],
        techStackKeywords: analysis.techStackKeywords || [],
        projectPurpose: analysis.projectPurpose || [],
        readmePatterns: analysis.readmePatterns || [],
        searchTerms: analysis.searchTerms || [],
        suggestedSearchQuery: analysis.suggestedSearchQuery || "",
        // Legacy compatibility
        frameworks: analysis.techStackKeywords || [],
        projectTypes: analysis.projectPurpose || [],
        domainKeywords: analysis.coreFeatures || [],
        searchTopics: analysis.searchTerms || [],
        model: this.model,
      };
    } catch (error) {
      console.error("Similar projects analysis error:", error);
      return {
        success: false,
        error: "Failed to analyze repositories.",
        coreFeatures: [],
        techStackKeywords: [],
        projectPurpose: [],
        readmePatterns: [],
        searchTerms: [],
        suggestedSearchQuery: "",
        frameworks: [],
        projectTypes: [],
        domainKeywords: [],
        searchTopics: [],
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════════════════════════════════════

let instance = null;
const getGroqService = () => {
  if (!instance) {
    instance = new GroqService();
    console.log("🤖 DevTrack AI (Expert Edition) initialized");
  }
  return instance;
};

module.exports = {
  GroqService,
  getGroqService,
};
