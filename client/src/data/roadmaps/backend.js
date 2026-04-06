export const backendRoadmap = {
  id: 'backend',
  title: 'Backend Development',
  description: 'A complete guide to becoming a backend engineer',
  icon: '⚙️',
  color: '#22d3ee',
  gradient: 'from-cyan-500 to-blue-600',
  totalTopics: 0,
  sections: [
    {
      id: 'internet',
      title: 'Internet Fundamentals',
      color: '#6366f1',
      topics: [
        { id: 'http', label: 'HTTP / HTTPS & REST', type: 'required' },
        { id: 'tcp-udp', label: 'TCP/IP, UDP', type: 'required' },
        { id: 'dns', label: 'DNS & How Servers Work', type: 'required' },
      ]
    },
    {
      id: 'language',
      title: 'Pick a Language',
      color: '#f59e0b',
      topics: [
        { id: 'nodejs', label: 'Node.js / JavaScript', type: 'required' },
        { id: 'python', label: 'Python', type: 'optional' },
        { id: 'go', label: 'Go', type: 'optional' },
        { id: 'java', label: 'Java / Kotlin', type: 'optional' },
        { id: 'rust', label: 'Rust', type: 'optional' },
      ]
    },
    {
      id: 'os-basics',
      title: 'OS & General Knowledge',
      color: '#64748b',
      topics: [
        { id: 'terminal', label: 'Terminal & Command Line', type: 'required' },
        { id: 'processes', label: 'Processes & Threads', type: 'recommended' },
        { id: 'memory', label: 'Memory Management', type: 'recommended' },
        { id: 'posix', label: 'POSIX Basics', type: 'optional' },
      ]
    },
    {
      id: 'databases',
      title: 'Databases',
      color: '#22d3ee',
      topics: [
        { id: 'sql', label: 'SQL (PostgreSQL / MySQL)', type: 'required' },
        { id: 'nosql', label: 'NoSQL (MongoDB / DynamoDB)', type: 'recommended' },
        { id: 'orm', label: 'ORMs (Prisma, Sequelize)', type: 'recommended' },
        { id: 'db-design', label: 'Database Design & Normalization', type: 'required' },
        { id: 'acid', label: 'ACID Properties & Transactions', type: 'recommended' },
        { id: 'indexes', label: 'Indexes & Query Optimization', type: 'recommended' },
      ]
    },
    {
      id: 'apis',
      title: 'APIs',
      color: '#a855f7',
      topics: [
        { id: 'rest', label: 'RESTful APIs', type: 'required' },
        { id: 'graphql', label: 'GraphQL', type: 'optional' },
        { id: 'grpc', label: 'gRPC', type: 'optional' },
        { id: 'websockets', label: 'WebSockets & Real-time APIs', type: 'recommended' },
        { id: 'openapi', label: 'OpenAPI / Swagger', type: 'recommended' },
      ]
    },
    {
      id: 'auth',
      title: 'Authentication & Security',
      color: '#ef4444',
      topics: [
        { id: 'jwt', label: 'JWT & Session-based Auth', type: 'required' },
        { id: 'oauth', label: 'OAuth 2.0 & OpenID', type: 'required' },
        { id: 'hashing', label: 'Hashing (bcrypt)', type: 'required' },
        { id: 'cors', label: 'CORS', type: 'required' },
        { id: 'ssl', label: 'HTTPS / SSL / TLS', type: 'required' },
        { id: 'csrf', label: 'CSRF & XSS Prevention', type: 'recommended' },
      ]
    },
    {
      id: 'caching',
      title: 'Caching',
      color: '#f97316',
      topics: [
        { id: 'redis', label: 'Redis (in-memory cache)', type: 'required' },
        { id: 'cdn', label: 'CDN Caching', type: 'recommended' },
        { id: 'cache-strategies', label: 'Cache Invalidation Strategies', type: 'recommended' },
      ]
    },
    {
      id: 'testing',
      title: 'Testing',
      color: '#16a34a',
      topics: [
        { id: 'unit', label: 'Unit Testing (Jest / Vitest)', type: 'required' },
        { id: 'integration', label: 'Integration Tests', type: 'recommended' },
        { id: 'e2e', label: 'End-to-End Testing', type: 'optional' },
      ]
    },
    {
      id: 'devops-basics',
      title: 'DevOps Basics',
      color: '#0ea5e9',
      topics: [
        { id: 'git', label: 'Git & Version Control', type: 'required' },
        { id: 'docker-basics', label: 'Docker (containers)', type: 'required' },
        { id: 'ci-cd', label: 'CI/CD Pipelines (GitHub Actions)', type: 'recommended' },
        { id: 'nginx', label: 'Nginx / Reverse Proxies', type: 'recommended' },
      ]
    },
    {
      id: 'messaging',
      title: 'Message Queues & Event Streaming',
      color: '#ec4899',
      topics: [
        { id: 'rabbitmq', label: 'RabbitMQ / BullMQ', type: 'optional' },
        { id: 'kafka', label: 'Apache Kafka', type: 'optional' },
        { id: 'event-driven', label: 'Event-Driven Architecture', type: 'recommended' },
      ]
    },
    {
      id: 'scaling',
      title: 'Scalability & Architecture',
      color: '#8b5cf6',
      topics: [
        { id: 'load-balancing', label: 'Load Balancing', type: 'required' },
        { id: 'microservices', label: 'Microservices Architecture', type: 'recommended' },
        { id: 'horizontal-scaling', label: 'Horizontal vs Vertical Scaling', type: 'recommended' },
        { id: 'rate-limiting', label: 'Rate Limiting & Throttling', type: 'recommended' },
        { id: 'design-patterns', label: 'Design Patterns (MVC, DDD, etc.)', type: 'recommended' },
      ]
    },
  ]
}
