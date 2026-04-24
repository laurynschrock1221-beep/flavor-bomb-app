'use client'

import { useState, useEffect, useCallback } from 'react'

const KEY = 'flavor-bomb-favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY)
      if (stored) setFavorites(new Set(JSON.parse(stored) as string[]))
    } catch {}
  }, [])

  const toggle = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem(KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }, [])

  return { favorites, toggle }
}
