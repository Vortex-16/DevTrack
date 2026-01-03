import { useRef, useState, useMemo, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ProfessionalLoader from './ProfessionalLoader';

export default function PixelTransition({ loading, children }) {
  const containerRef = useRef(null);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Ensure we only portal after mount to avoid SSR issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize synchronously to avoid first-render black screen
  const [dimensions, setDimensions] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  }));

  // Update dimensions on resize
  useLayoutEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Memoize blocks to prevent unnecessary re-renders
  const blocks = useMemo(() => {
    if (dimensions.width === 0) return [];

    // Larger blocks for performance (mobile: 40px, desktop: 60px)
    const blockSize = dimensions.width < 768 ? 40 : 60;
    const cols = Math.ceil(dimensions.width / blockSize);
    const rows = Math.ceil(dimensions.height / blockSize);
    
    return Array.from({ length: cols * rows }).map((_, i) => ({
      id: i,
      width: blockSize,
      height: blockSize
    }));
  }, [dimensions.width, dimensions.height]);

  // Lock body scroll during transition to prevent interaction
  useLayoutEffect(() => {
    if (!isAnimationComplete || loading) {
      // Calculate scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Apply to both html and body
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      
      // Compensate width to prevent content shift
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [loading, isAnimationComplete]);

  useGSAP(() => {
    if (!loading && blocks.length > 0 && !isAnimationComplete) {
      // Kill previous tweens
      gsap.killTweensOf(".pixel-block");

      gsap.to(".pixel-block", {
        opacity: 0,
        duration: 0.25, // Fast snappy transition
        ease: "power1.out",
        stagger: {
          amount: 0.5,
          grid: "auto",
          from: "random",
        },
        onComplete: () => {
          setIsAnimationComplete(true);
        }
      });
    }
  }, { dependencies: [loading, blocks.length], scope: containerRef });

  // Render children normally, but portal the overlay
  return (
    <>
      {children}

      {/* 
        Only render overlay if mounted AND (loading OR animation is running).
        Portal ensures it breaks out of any parent transforms (Lenis, Motion, etc.) 
        to truly cover the viewport.
      */}
      {mounted && (!isAnimationComplete || loading) && createPortal(
        <div 
          ref={containerRef} 
          className="fixed inset-0 md:left-[80px] z-[9999] pointer-events-none overflow-hidden"
          style={{ 
            width: 'auto', 
            height: '100vh', 
            top: 0,
            display: 'grid',
            // Re-calculate basic metrics for the grid style
            gridTemplateColumns: `repeat(${Math.ceil(dimensions.width / (dimensions.width < 768 ? 40 : 60))}, ${dimensions.width < 768 ? 40 : 60}px)`,
          }}
        >
          {/* Loader on top of blocks while loading */}
          {loading && (
             <div className="absolute inset-0 z-[10000] flex items-center justify-center pointer-events-none">
                 <ProfessionalLoader size="lg" showText={false} />
             </div>
          )}

          {blocks.length > 0 ? (
            blocks.map((block) => (
              <div
                key={block.id}
                className="pixel-block bg-slate-950"
                style={{
                  width: '100%',
                  height: '100%',
                  margin: '-1px' // overlap to prevent gaps
                }}
              />
            ))
          ) : (
            <div className="w-full h-full bg-slate-950" />
          )}
        </div>,
        document.body
      )}
    </>
  );
}
