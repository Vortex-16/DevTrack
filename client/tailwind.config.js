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
                // Dark: Deep Matte Black (#090C0E) but mapped to light backgrounds for legacy layouts
                dark: {
                    50: '#090C0E',
                    100: '#090C0E',
                    200: '#23201E',
                    300: '#4B4138',
                    400: '#666664',
                    500: '#666664',
                    600: '#4B4138',
                    700: '#CEA885',
                    800: '#F1DBC5', // off-white
                    900: '#EAC5A2', // soft sand
                    950: '#FDF2E7', // cream white
                },
                // Slate: Map legacy dark classes to the new warm sand/cream theme
                slate: {
                    50: '#090C0E',
                    100: '#090C0E',
                    200: '#23201E',
                    300: '#4B4138',
                    400: '#666664',
                    500: '#666664',
                    600: '#4B4138',
                    700: '#CEA885',
                    800: '#F1DBC5', // off-white
                    900: '#EAC5A2', // soft sand
                    950: '#FDF2E7', // cream white
                },
                // Purple: Legacy purple components now map to Burnt Orange
                purple: {
                    50: '#faf6f0',
                    100: '#f3e8da',
                    200: '#e7ceb4',
                    300: '#d9ad8b',
                    400: '#c88b63',
                    500: '#B58561', // main burnt orange
                    600: '#a76b4e',
                    700: '#8b5340',
                    800: '#714237',
                    900: '#5c3730',
                    950: '#321b18',
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
