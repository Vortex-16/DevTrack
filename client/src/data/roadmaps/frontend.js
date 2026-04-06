export const frontendRoadmap = {
  id: 'frontend',
  title: 'Frontend Development',
  description: 'Step-by-step guide to becoming a modern frontend developer',
  icon: '🎨',
  color: '#a855f7',
  gradient: 'from-purple-600 to-pink-600',
  totalTopics: 0, // computed
  sections: [
    {
      id: 'internet',
      title: 'Internet & Web Basics',
      color: '#6366f1',
      topics: [
        { id: 'how-internet-works', label: 'How does the Internet work?', type: 'required' },
        { id: 'http', label: 'HTTP / HTTPS', type: 'required' },
        { id: 'browsers', label: 'How Browsers Work', type: 'required' },
        { id: 'dns', label: 'DNS & Domain Names', type: 'required' },
        { id: 'hosting', label: 'Hosting Concepts', type: 'recommended' },
      ]
    },
    {
      id: 'html',
      title: 'HTML',
      color: '#e85d29',
      topics: [
        { id: 'html-basics', label: 'HTML Basics & Semantics', type: 'required' },
        { id: 'forms', label: 'Forms & Validations', type: 'required' },
        { id: 'accessibility', label: 'Accessibility (a11y)', type: 'required' },
        { id: 'seo-basics', label: 'SEO Basics', type: 'recommended' },
      ]
    },
    {
      id: 'css',
      title: 'CSS',
      color: '#2965f1',
      topics: [
        { id: 'css-basics', label: 'Selectors & Properties', type: 'required' },
        { id: 'box-model', label: 'Box Model & Positioning', type: 'required' },
        { id: 'flexbox', label: 'Flexbox', type: 'required' },
        { id: 'grid', label: 'CSS Grid', type: 'required' },
        { id: 'responsive', label: 'Responsive Design & Media Queries', type: 'required' },
        { id: 'animations', label: 'Transitions & Animations', type: 'recommended' },
        { id: 'css-variables', label: 'CSS Variables & Custom Properties', type: 'recommended' },
      ]
    },
    {
      id: 'javascript',
      title: 'JavaScript',
      color: '#f7df1e',
      textColor: '#000',
      topics: [
        { id: 'js-basics', label: 'Syntax & Variables', type: 'required' },
        { id: 'dom', label: 'DOM Manipulation', type: 'required' },
        { id: 'fetch', label: 'Fetch API & AJAX', type: 'required' },
        { id: 'es6', label: 'ES6+ (arrow fns, destructuring, modules)', type: 'required' },
        { id: 'promises', label: 'Promises & Async/Await', type: 'required' },
        { id: 'closures', label: 'Closures & Scope', type: 'required' },
        { id: 'event-loop', label: 'Event Loop & Callbacks', type: 'recommended' },
      ]
    },
    {
      id: 'version-control',
      title: 'Version Control',
      color: '#f05032',
      topics: [
        { id: 'git', label: 'Git (basics: clone, commit, push, pull)', type: 'required' },
        { id: 'github', label: 'GitHub / GitLab', type: 'required' },
        { id: 'branching', label: 'Branching Strategies', type: 'recommended' },
      ]
    },
    {
      id: 'package-managers',
      title: 'Package Managers',
      color: '#cb3837',
      topics: [
        { id: 'npm', label: 'npm', type: 'required' },
        { id: 'yarn', label: 'Yarn / pnpm', type: 'optional' },
      ]
    },
    {
      id: 'frameworks',
      title: 'Frontend Frameworks',
      color: '#61dafb',
      textColor: '#000',
      topics: [
        { id: 'react', label: 'React (recommended)', type: 'required' },
        { id: 'vue', label: 'Vue.js', type: 'optional' },
        { id: 'angular', label: 'Angular', type: 'optional' },
        { id: 'svelte', label: 'Svelte / SolidJS', type: 'optional' },
      ]
    },
    {
      id: 'react-ecosystem',
      title: 'React Ecosystem',
      color: '#a855f7',
      topics: [
        { id: 'hooks', label: 'React Hooks', type: 'required' },
        { id: 'router', label: 'React Router', type: 'required' },
        { id: 'state', label: 'State Management (Zustand / Redux)', type: 'recommended' },
        { id: 'react-query', label: 'React Query / SWR', type: 'recommended' },
        { id: 'nextjs', label: 'Next.js (SSR & SSG)', type: 'recommended' },
      ]
    },
    {
      id: 'css-tooling',
      title: 'CSS Tooling',
      color: '#38bdf8',
      topics: [
        { id: 'tailwind', label: 'Tailwind CSS', type: 'recommended' },
        { id: 'sass', label: 'Sass / SCSS', type: 'optional' },
        { id: 'css-modules', label: 'CSS Modules', type: 'optional' },
        { id: 'styled-components', label: 'Styled Components', type: 'optional' },
      ]
    },
    {
      id: 'testing',
      title: 'Testing',
      color: '#16a34a',
      topics: [
        { id: 'jest', label: 'Jest (unit testing)', type: 'recommended' },
        { id: 'rtl', label: 'React Testing Library', type: 'recommended' },
        { id: 'playwright', label: 'Playwright / Cypress (E2E)', type: 'optional' },
      ]
    },
    {
      id: 'build-tools',
      title: 'Build Tools & Performance',
      color: '#f97316',
      topics: [
        { id: 'vite', label: 'Vite / Webpack', type: 'required' },
        { id: 'bundlers', label: 'Module Bundlers', type: 'recommended' },
        { id: 'web-vitals', label: 'Web Vitals & Performance', type: 'recommended' },
        { id: 'lazy-loading', label: 'Lazy Loading & Code Splitting', type: 'recommended' },
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced & Modern Topics',
      color: '#ec4899',
      topics: [
        { id: 'typescript', label: 'TypeScript', type: 'recommended' },
        { id: 'pwa', label: 'Progressive Web Apps (PWA)', type: 'optional' },
        { id: 'webassembly', label: 'WebAssembly basics', type: 'optional' },
        { id: 'graphql', label: 'GraphQL (client-side)', type: 'optional' },
        { id: 'micro-frontends', label: 'Micro Frontends', type: 'optional' },
      ]
    },
  ]
}
