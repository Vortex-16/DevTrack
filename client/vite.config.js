import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-clerk': ['@clerk/clerk-react'],
                    'vendor-motion': ['framer-motion', 'gsap'],
                    'vendor-icons': ['lucide-react', 'react-icons'],
                },
            },
        },
        chunkSizeWarningLimit: 600,
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:9000',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})

