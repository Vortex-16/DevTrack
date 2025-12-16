import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with Tailwind CSS class merging
 * Usage: cn('bg-red-500', someCondition && 'text-white')
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs))
}
