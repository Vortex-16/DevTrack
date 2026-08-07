/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // New Primary: Cyan/Teal (#4dd0e1)
                primary: {
                    50: '#e0f7fa',
                    100: '#b2ebf2',
                    200: '#80deea',
                    300: '#4dd0e1',
                    400: '#26c6da',
                    500: '#00bcd4',
                    600: '#00acc1',
                    700: '#0097a7',
                    800: '#00838f',
                    900: '#006064',
                    950: '#00363a',
                },
                // New Accent: Copper/Gold (#e8a838)
                accent: {
                    50: '#fdf8f0',
                    100: '#faeedb',
                    200: '#f4d9b2',
                    300: '#ecc285',
                    400: '#e8a838', // Main copper
                    500: '#df8e1c',
                    600: '#d07414',
                    700: '#ad5913',
                    800: '#8a4616',
                    900: '#6f3915',
                    950: '#3c1b09',
                },
                // New Dark: True Deep Black
                dark: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#222222', // Slightly lighter dark
                    900: '#1a1a1a', // DevTrack Poster Main Background
                    950: '#111111', // Deepest dark
                },
                border: '#333333',
                tier: {
                    free: '#94a3b8',
                    pro: '#4dd0e1', // Cyan for pro
                    enterprise: '#e8a838', // Copper for enterprise
                },
                quota: {
                    safe: '#4dd0e1',
                    warning: '#e8a838',
                    danger: '#ef4444',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            keyframes: {
                shimmer: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' },
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                shimmer: 'shimmer 1.5s infinite',
                'fade-in': 'fade-in 0.3s ease-out',
                'slide-up': 'slide-up 0.4s ease-out',
            },
        },
    },
    plugins: [],
}
