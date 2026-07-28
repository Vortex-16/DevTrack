import React, { useState } from 'react';

/**
 * Tooltip — Lightweight accessible tooltip component
 */
const Tooltip = ({ children, content, position = 'top' }) => {
    const [visible, setVisible] = useState(false);

    const positionClasses = {
        top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
        bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
        left: 'right-full mr-2 top-1/2 -translate-y-1/2',
        right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    };

    return (
        <div
            className="relative inline-flex"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onFocus={() => setVisible(true)}
            onBlur={() => setVisible(false)}
        >
            {children}
            {visible && content && (
                <div
                    className={`absolute z-40 px-2.5 py-1 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg shadow-xl whitespace-nowrap pointer-events-none ${positionClasses[position]} animate-fade-in`}
                >
                    {content}
                </div>
            )}
        </div>
    );
};

export default Tooltip;
