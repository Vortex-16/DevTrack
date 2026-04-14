// DevTrack Design System — Color Tokens
// Mirrors the web app's dark theme aesthetics

export const colors = {
  // === Background layers ===
  bg: {
    primary: '#020617',    // slate-950 — deepest background
    secondary: '#0f172a',  // slate-900 — card bg
    elevated: '#1e293b',   // slate-800 — elevated card
    border: '#1e293b',     // slate-800 — borders
    subtle: '#334155',     // slate-700 — subtle elements
  },

  // === Text ===
  text: {
    primary: '#f1f5f9',    // slate-100
    secondary: '#94a3b8',  // slate-400
    muted: '#475569',      // slate-600
    inverse: '#020617',
  },

  // === Brand / Accent ===
  accent: {
    primary: '#6366f1',    // indigo-500
    primaryLight: '#818cf8', // indigo-400
    secondary: '#8b5cf6',  // violet-500
    glow: 'rgba(99,102,241,0.15)',
    glowStrong: 'rgba(99,102,241,0.3)',
  },

  // === Semantic ===
  green: {
    default: '#22c55e',
    bg: 'rgba(34,197,94,0.15)',
  },
  yellow: {
    default: '#eab308',
    bg: 'rgba(234,179,8,0.15)',
  },
  red: {
    default: '#ef4444',
    bg: 'rgba(239,68,68,0.15)',
  },
  blue: {
    default: '#3b82f6',
    bg: 'rgba(59,130,246,0.15)',
  },
  purple: {
    default: '#a855f7',
    bg: 'rgba(168,85,247,0.15)',
  },
  cyan: {
    default: '#06b6d4',
    bg: 'rgba(6,182,212,0.15)',
  },
  orange: {
    default: '#f97316',
    bg: 'rgba(249,115,22,0.15)',
  },

  // === Utility ===
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;
