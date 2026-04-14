/**
 * Modern API UI Middleware
 * Intercepts JSON responses and serves a beautiful, modern HTML interface
 * when the request comes from a web browser (accepts text/html).
 */

const getHtmlTemplate = (req, data, statusCodeStr) => {
    const jsonString = JSON.stringify(data, null, 2);
    const endpoint = req.originalUrl;
    const method = req.method;
    
    // Determine status color
    const statusClass = statusCodeStr.startsWith('2') ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 
                       statusCodeStr.startsWith('4') ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                       statusCodeStr.startsWith('5') ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' :
                       'text-blue-400 bg-blue-400/10 border-blue-400/20';

    return `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DevTrack API | ${endpoint}</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
    <script>hljs.highlightAll();</script>
    <style>
        :root {
            --color-background: #0f172a;
            --color-surface: #1e293b;
            --color-primary: #8b5cf6;
        }
        body { 
            font-family: 'Inter', sans-serif; 
            background-color: var(--color-background);
            color: #cbd5e1;
        }
        pre, code { font-family: 'JetBrains Mono', monospace; }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #475569; }
        
        /* Glassmorphism effects */
        .glass-panel {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .animated-bg {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            z-index: -1;
            background: radial-gradient(circle at 15% 50%, rgba(139, 92, 246, 0.15), transparent 25%),
                        radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.15), transparent 25%);
            animation: pulse-bg 15s ease-in-out infinite alternate;
        }

        @keyframes pulse-bg {
            0% { transform: scale(1); }
            100% { transform: scale(1.05); }
        }
        
        /* hljs overrides for better blending */
        .hljs { background: transparent !important; padding: 0 !important; }
    </style>
</head>
<body class="min-h-screen antialiased">
    <div class="animated-bg"></div>
    
    <div class="max-w-6xl mx-auto p-6 lg:p-12">
        <header class="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <div class="flex items-center gap-3 mb-2">
                    <div class="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-lg">
                        <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h1 class="text-2xl font-bold text-white">
                        DevTrack API
                    </h1>
                </div>
                <p class="text-gray-400 text-sm">System & API Status Interface</p>
            </div>
            
            <div class="flex items-center gap-4">
                <a href="${req.baseUrl || '/'}" class="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors border border-transparent">
                    API Root
                </a>
                <a href="http://localhost:5173" class="px-4 py-2 rounded-lg text-sm font-medium bg-white bg-opacity-10 hover:bg-opacity-20 text-white transition-colors border border-white border-opacity-10 backdrop-blur-sm">
                    Open App
                </a>
            </div>
        </header>

        <main class="space-y-6">
            <!-- Request Card -->
            <div class="glass-panel rounded-2xl p-6 lg:p-8 shadow-2xl">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div class="flex items-center gap-3 overflow-hidden">
                        <span class="px-3 py-1 text-xs font-bold rounded-md bg-blue-900 text-blue-300 border border-blue-700 uppercase tracking-widest">
                            ${method}
                        </span>
                        <code class="text-sm text-gray-300 sm:text-base break-all bg-gray-900 px-3 py-1.5 rounded-md border border-gray-700">
                            ${endpoint}
                        </code>
                    </div>
                    <div class="flex items-center gap-2 px-4 py-1.5 rounded-full border ${statusClass} shadow-sm">
                        <div class="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                        <span class="text-sm font-semibold tracking-wide">Status: ${statusCodeStr}</span>
                    </div>
                </div>

                <!-- Payload Payload -->
                <div class="relative group">
                    <div class="absolute inset-x-0 top-0 bg-gray-900 rounded-t-xl border-b border-gray-700 z-10 h-10 flex items-center px-4">
                        <div class="flex gap-1.5">
                            <div class="w-3 h-3 rounded-full bg-gray-600"></div>
                            <div class="w-3 h-3 rounded-full bg-gray-600"></div>
                            <div class="w-3 h-3 rounded-full bg-gray-600"></div>
                        </div>
                        <span class="text-xs text-gray-400 font-mono ml-4 select-none">Response Payload</span>
                    </div>
                    <div class="bg-black bg-opacity-50 rounded-xl border border-gray-800 overflow-hidden shadow-inner pt-10">
                        <pre><code class="language-json p-6 text-sm sm:text-base">${jsonString}</code></pre>
                    </div>
                </div>
            </div>
            
            <!-- Metadata Footer -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="glass-panel rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span class="text-xs text-gray-500 uppercase tracking-wider mb-1">Time</span>
                    <span class="text-sm font-medium text-gray-300">${new Date().toLocaleTimeString()}</span>
                </div>
                <div class="glass-panel rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span class="text-xs text-gray-500 uppercase tracking-wider mb-1">Engine</span>
                    <span class="text-sm font-medium text-gray-300">Node.js Express</span>
                </div>
                <div class="glass-panel rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span class="text-xs text-gray-500 uppercase tracking-wider mb-1">Response Type</span>
                    <span class="text-sm font-medium text-gray-300">application/json</span>
                </div>
                <div class="glass-panel rounded-xl p-4 flex flex-col items-center justify-center text-center">
                    <span class="text-xs text-gray-500 uppercase tracking-wider mb-1">Environment</span>
                    <span class="text-sm font-medium text-purple-400">${process.env.NODE_ENV || 'development'}</span>
                </div>
            </div>
        </main>
        
        <footer class="mt-12 text-center text-gray-500 text-sm pb-8">
            Powered by DevTrack Backend &copy; ${new Date().getFullYear()}
        </footer>
    </div>
</body>
</html>
    `;
};

const modernApiUI = (req, res, next) => {
    // Store original res.json
    const originalJson = res.json;

    // Override res.json
    res.json = function (data) {
        // Check if the request accepts HTML and doesn't explicitly prefer JSON
        const acceptsHtml = req.accepts('html', 'json') === 'html';
        
        // Ensure it's not a preflight/options request or specifically asking for JSON
        const isBrowserRequest = acceptsHtml && req.method !== 'OPTIONS';

        if (isBrowserRequest) {
            // Restore original json method to prevent recursive loops if used later
            res.json = originalJson;

            // Generate HTML
            const statusCode = res.statusCode || 200;
            const html = getHtmlTemplate(req, data, statusCode.toString());

            // Send HTML response
            return res.status(statusCode).setHeader('Content-Type', 'text/html').send(html);
        }

        // If not a browser request, proceed with normal JSON response
        return originalJson.call(this, data);
    };

    next();
};

module.exports = modernApiUI;
