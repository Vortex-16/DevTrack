import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'

const CacheContext = createContext(null)

export function CacheProvider({ children }) {
    const [cache, setCache] = useState({})

    const setCachedData = useCallback((key, data) => {
        setCache(prev => ({
            ...prev,
            [key]: {
                data,
                timestamp: Date.now()
            }
        }))
    }, [])

    const getCachedData = useCallback((key) => {
        return cache[key]?.data || null
    }, [cache])

    const hasCachedData = useCallback((key) => {
        return !!cache[key]
    }, [cache])

    const value = useMemo(() => ({
        cache,
        setCachedData,
        getCachedData,
        hasCachedData
    }), [cache, setCachedData, getCachedData, hasCachedData])

    return (
        <CacheContext.Provider value={value}>
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
