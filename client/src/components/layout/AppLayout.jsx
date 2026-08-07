import { Outlet, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './Navbar';
import OnboardingCheck from '../auth/OnboardingCheck';

export default function AppLayout() {
    const location = useLocation();

    return (
        <OnboardingCheck>
            <div className="min-h-screen bg-brand-cream">
                <Navbar />
                {/* Main content with sidebar offset for desktop */}
                <div className="md:ml-[80px] min-h-screen flex flex-col">
                    <div className="max-w-[1400px] mx-auto w-full px-4 py-6 md:py-8 flex-1 flex flex-col justify-between">
                        <AnimatePresence mode="wait">
                            <motion.main
                                key={location.pathname}
                                className="relative flex-1"
                                initial={{ opacity: 0, scale: 0.99, filter: 'blur(5px)' }}
                                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, scale: 1.01, filter: 'blur(5px)' }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                            >
                                <Outlet />
                            </motion.main>
                        </AnimatePresence>

                        {/* Unified Professional Footer */}
                        <footer className="mt-12 pt-6 border-t border-brand-oak/20 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-steel gap-4">
                            <div>© {new Date().getFullYear()} DevTrack. Build Faster. Track Smarter.</div>
                            <div className="flex items-center gap-6 font-medium">
                                <Link to="/guide" className="hover:text-primary-500 transition-colors">
                                    User Guide
                                </Link>
                                <Link to="/privacy" className="hover:text-primary-500 transition-colors">
                                    Privacy Policy
                                </Link>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </OnboardingCheck>
    );
}
