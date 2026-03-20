import { motion } from 'framer-motion'
import { DotLottieReact } from '@lottiefiles/dotlottie-react'

export default function ProfessionalLoader({ className = "", size = "md" }) {
    const sizeClasses = {
        sm: "w-32 h-32",
        md: "w-64 h-64",
        lg: "w-96 h-96"
    }

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
                <DotLottieReact
                    src="https://lottie.host/d4a2e1f2-3cd8-4222-bb26-f299c77505c5/2kDhLuj4HI.lottie"
                    loop
                    autoplay
                />
            </div>
        </div>
    )
}
