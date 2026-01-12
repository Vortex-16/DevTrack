import ProfessionalLoader from './ProfessionalLoader';
import { AnimatePresence, motion } from 'framer-motion';

import { createPortal } from 'react-dom';

export default function PixelTransition({ loading, children }) {
  return (
    <>
      {children}
      {createPortal(
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[9500] flex items-center justify-center bg-slate-950"
            >
              <ProfessionalLoader size="lg" showText={false} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
