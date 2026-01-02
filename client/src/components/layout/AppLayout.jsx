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
                <div className="md:ml-[80px] min-h-screen flex flex-col">
                    <div className="max-w-[1400px] mx-auto w-full px-4 py-6 md:py-8 flex-1 flex flex-col justify-center">
                        <AnimatePresence mode="wait">
                            <motion.main
                                key={location.pathname}
                                className="relative"
                                initial={{ opacity: 0, scale: 0.99, filter: "blur(5px)" }}
                                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                exit={{ opacity: 0, scale: 1.01, filter: "blur(5px)" }}
                                transition={{ duration: 0.25, ease: "easeOut" }}
                            >
                                <Outlet />
                            </motion.main>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </OnboardingCheck>
    )
}
