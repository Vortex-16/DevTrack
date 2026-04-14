import React from 'react';
import { Link } from 'react-router-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full flex flex-col items-center"
      >
        <div className="w-full h-64 md:h-80 relative flex justify-center items-center mb-8">
          <DotLottieReact
            src="https://lottie.host/30b34784-845f-437d-a77f-4d83acc29980/pihcMkDUai.lottie"
            loop
            autoplay
          />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
          Page Not Found
        </h1>
        
        <p className="text-slate-400 text-center mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        
        <Link 
          to="/" 
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-purple-600/20"
        >
          Return Home
        </Link>
      </motion.div>
    </div>
  );
}
