import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function LoadingText() {
    const containerRef = useRef(null)
    const text = "Loading..."
    const letters = text.split("")

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(".loading-letter",
                {
                    y: 0,
                    color: "#94a3b8" // slate-400
                },
                {
                    y: -15,
                    color: "#8b5cf6", // primary-500
                    stagger: {
                        each: 0.1,
                        yoyo: true,
                        repeat: -1
                    },
                    ease: "sine.inOut",
                    duration: 0.5
                }
            )
        }, containerRef)

        return () => ctx.revert()
    }, [])

    return (
        <div ref={containerRef} className="flex gap-1 text-2xl font-bold">
            {letters.map((letter, i) => (
                <span key={i} className="loading-letter inline-block">
                    {letter}
                </span>
            ))}
        </div>
    )
}
