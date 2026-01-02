import React, { createContext, useContext, useState } from 'react'

const CacheContext = createContext(null)

export function CacheProvider({ children }) {
    const [cache, setCache] = useState({})

    const setCachedData = (key, data) => {
        setCache(prev => ({
            ...prev,
            [key]: {
                data,
                timestamp: Date.now()
            }
        }))
    }

    const getCachedData = (key) => {
        return cache[key]?.data || null
    }

    const hasCachedData = (key) => {
        return !!cache[key]
    }

    return (
        <CacheContext.Provider value={{ cache, setCachedData, getCachedData, hasCachedData }}>
            {children}
        </CacheContext.Provider>
    )
}

export function useCache() {
    const context = useContext(CacheContext)
    if (!context) {
        throw new Error('useCache must be used within a CacheProvider')
    }
    return context
}
