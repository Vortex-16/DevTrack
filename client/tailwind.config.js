/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary: Deep Navy Blue (#173E63)
                primary: {
                    50: '#edf5fb',
                    100: '#d7e6f5',
                    200: '#b5d0ec',
                    300: '#82b0df',
                    400: '#498ccf',
                    500: '#173E63', // Main navy
                    600: '#1d568c',
                    700: '#1a4773',
                    800: '#183c5e',
                    900: '#183350',
                    950: '#102135',
                },
                // Accent: Burnt Orange (#B58561)
                accent: {
                    50: '#faf6f0',
                    100: '#f3e8da',
                    200: '#e7ceb4',
                    300: '#d9ad8b',
                    400: '#c88b63',
                    500: '#B58561', // Main burnt orange
                    600: '#a76b4e',
                    700: '#8b5340',
                    800: '#714237',
                    900: '#5c3730',
                    950: '#321b18',
                },
                // Dark: Deep Matte Black (#090C0E)
                dark: {
                    50: '#f5f6f6',
                    100: '#e4e6e7',
                    200: '#cdd0d3',
                    300: '#abb1b6',
                    400: '#818b93',
                    500: '#5f6a73',
                    600: '#4b555d',
                    700: '#3b4349',
                    800: '#23201E', // Charcoal Slate
                    900: '#090C0E', // Deep Matte Black
                    950: '#050708',
                },
                brand: {
                    cream: '#FDF2E7',
                    sand: '#EAC5A2',
                    oak: '#CEA885',
                    offwhite: '#F1DBC5',
                    steel: '#666664',
                    tech: '#406D81',
                    slate: '#648796',
                    walnut: '#4B4138',
                },
                border: '#e7ceb4', // Warm sand border
                tier: {
                    free: '#666664',
                    pro: '#173E63',
                    enterprise: '#B58561',
                },
                quota: {
                    safe: '#406D81',
                    warning: '#B58561',
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
