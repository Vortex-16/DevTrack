import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download, ExternalLink } from 'lucide-react';

const AppDownloadPopup = () => {
    const [isVisible, setIsVisible] = useState(false);
    const APP_LINK = "https://github.com/Vortex-16/DevTrack/releases/download/Version1.1.0/DevTrack.apk";

    useEffect(() => {
        // Check if user is on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check if popup was already dismissed
        const isDismissed = localStorage.getItem('devtrack_app_dismissed');

        if (isMobile && !isDismissed) {
            // Show popup after a short delay
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('devtrack_app_dismissed', 'true');
    };

    const handleDownload = () => {
        window.open(APP_LINK, '_blank');
        handleDismiss();
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-20 left-4 right-4 z-[15000] md:hidden"
                >
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-4 shadow-2xl relative overflow-hidden">
                        {/* Background Glow */}
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
                        
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <Smartphone className="text-white w-6 h-6" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                                    DevTrack for Android
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] border border-emerald-500/20">
                                        v1.1.0
                                    </span>
                                </h3>
                                <p className="text-slate-400 text-xs leading-relaxed mb-3">
                                    Track your projects on the go with our native Android app!
                                </p>
                                
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDownload}
                                        className="flex-1 bg-white text-slate-900 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
                                    >
                                        <Download size={14} />
                                        Download APK
                                    </button>
                                    <button
                                        onClick={handleDismiss}
                                        className="px-4 py-2 rounded-lg bg-white/10 text-slate-300 text-xs font-medium active:scale-95 transition-transform border border-white/10"
                                    >
                                        Later
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleDismiss}
                                className="p-1 rounded-full hover:bg-white/10 text-slate-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AppDownloadPopup;
