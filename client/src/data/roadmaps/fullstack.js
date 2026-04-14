export const fullstackRoadmap = {
  id: 'fullstack',
  title: 'Full Stack Development',
  description: 'Master both frontend and backend to build complete applications',
  icon: '🚀',
  color: '#10b981',
  gradient: 'from-emerald-500 to-teal-600',
  totalTopics: 0,
  sections: [
    {
      id: 'fundamentals',
      title: 'Core Fundamentals',
      color: '#6366f1',
      topics: [
        { id: 'html-css', label: 'HTML & CSS mastery', type: 'required' },
        { id: 'js-core', label: 'JavaScript (ES6+)', type: 'required' },
        { id: 'git', label: 'Git & GitHub', type: 'required' },
        { id: 'terminal', label: 'Terminal / Command Line', type: 'required' },
      ]
    },
    {
      id: 'frontend-stack',
      title: 'Frontend Stack',
      color: '#a855f7',
      topics: [
        { id: 'react', label: 'React + Hooks', type: 'required' },
        { id: 'routing', label: 'React Router / Next.js', type: 'required' },
        { id: 'state-mgmt', label: 'State Management (Zustand)', type: 'recommended' },
        { id: 'css-fw', label: 'Tailwind CSS / Styled Components', type: 'recommended' },
        { id: 'api-calls', label: 'REST API Integration (fetch / axios)', type: 'required' },
      ]
    },
    {
      id: 'backend-stack',
      title: 'Backend Stack',
      color: '#22d3ee',
      topics: [
        { id: 'nodejs', label: 'Node.js + Express', type: 'required' },
        { id: 'rest-api', label: 'Building RESTful APIs', type: 'required' },
        { id: 'auth', label: 'Authentication (JWT, OAuth)', type: 'required' },
        { id: 'middleware', label: 'Middleware & Error Handling', type: 'required' },
        { id: 'file-upload', label: 'File Uploads & Storage', type: 'recommended' },
      ]
    },
    {
      id: 'databases',
      title: 'Databases',
      color: '#f59e0b',
      topics: [
        { id: 'sql', label: 'SQL Fundamentals (PostgreSQL)', type: 'required' },
        { id: 'nosql', label: 'MongoDB / Firebase', type: 'recommended' },
        { id: 'orm', label: 'Prisma / Mongoose ORM', type: 'required' },
        { id: 'redis', label: 'Redis (Caching & Sessions)', type: 'recommended' },
      ]
    },
    {
      id: 'devops',
      title: 'Deployment & DevOps',
      color: '#0ea5e9',
      topics: [
        { id: 'docker', label: 'Docker & Containerization', type: 'required' },
        { id: 'env', label: 'Environment Variables & Config', type: 'required' },
        { id: 'vercel-render', label: 'Deploy on Vercel / Render / Railway', type: 'required' },
        { id: 'ci-cd', label: 'CI/CD (GitHub Actions)', type: 'recommended' },
        { id: 'nginx', label: 'Nginx & Reverse Proxy', type: 'optional' },
      ]
    },
    {
      id: 'realtime',
      title: 'Real-time & Advanced Features',
      color: '#f97316',
      topics: [
        { id: 'websockets', label: 'WebSockets / Socket.io', type: 'recommended' },
        { id: 'notifications', label: 'Push Notifications', type: 'optional' },
        { id: 'search', label: 'Search (ElasticSearch)', type: 'optional' },
        { id: 'payments', label: 'Payment Integration (Stripe)', type: 'recommended' },
      ]
    },
    {
      id: 'testing',
      title: 'Testing',
      color: '#16a34a',
      topics: [
        { id: 'unit-test', label: 'Unit Tests (Jest)', type: 'recommended' },
        { id: 'integration', label: 'API Integration Tests', type: 'recommended' },
        { id: 'e2e', label: 'E2E Tests (Playwright)', type: 'optional' },
      ]
    },
    {
      id: 'security',
      title: 'Security Best Practices',
      color: '#ef4444',
      topics: [
        { id: 'cors', label: 'CORS & CSRF', type: 'required' },
        { id: 'https', label: 'HTTPS & SSL', type: 'required' },
        { id: 'input-validation', label: 'Input Validation & Sanitization', type: 'required' },
        { id: 'rate-limiting', label: 'Rate Limiting', type: 'recommended' },
        { id: 'owasp', label: 'OWASP Top 10', type: 'recommended' },
      ]
    },
    {
      id: 'advanced',
      title: 'Leveling Up',
      color: '#ec4899',
      topics: [
        { id: 'typescript', label: 'TypeScript', type: 'recommended' },
        { id: 'graphql', label: 'GraphQL (Apollo)', type: 'optional' },
        { id: 'microservices', label: 'Microservices / Monorepos', type: 'optional' },
        { id: 'ai-integration', label: 'AI Integration (OpenAI API)', type: 'optional' },
      ]
    },
  ]
}
