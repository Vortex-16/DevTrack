import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './Navbar'
import OnboardingCheck from '../auth/OnboardingCheck'

export default function AppLayout() {
    const location = useLocation()

    return (
        <OnboardingCheck>
            <div className="min-h-screen bg-dark-950">
                <Navbar />
                {/* Main content with sidebar offset for desktop */}
                <div className="lg:ml-[80px]">
                    <div className="max-w-7xl mx-auto px-6 py-8 lg:py-6">
                        <AnimatePresence mode="wait">
                            <motion.main
                                key={location.pathname}
                                className="relative"
                                initial="initial"
                                animate="animate"
                                exit="exit"
                            >
                                {/* Page Content Animation */}
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
                                    transition={{ duration: 0.4, ease: "easeInOut", delay: 0.1 }}
                                >
                                    <Outlet />
                                </motion.div>

                                {/* Curtain Wipe Overlay */}
                                <motion.div
                                    className="fixed inset-0 bg-primary-600/90 z-50 pointer-events-none"
                                    initial={{ scaleY: 1 }}
                                    animate={{ scaleY: 0 }}
                                    exit={{ scaleY: 1 }}
                                    style={{ originY: 0 }}
                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                />
                            </motion.main>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </OnboardingCheck>
    )
}
