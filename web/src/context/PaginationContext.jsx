import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'casan_pagination_pages'

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') return parsed
    }
  } catch {
    /* ignore */
  }
  return {}
}

function savePersisted(pages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pages))
  } catch {
    /* ignore */
  }
}

const PaginationContext = createContext(null)

export function PaginationProvider({ children }) {
  const [pages, setPagesState] = useState(loadPersisted)

  useEffect(() => {
    savePersisted(pages)
  }, [pages])

  const setPage = useCallback((tabKey, updater) => {
    setPagesState((prev) => {
      const current = prev[tabKey] ?? 1
      const next = typeof updater === 'function' ? updater(current) : updater
      return { ...prev, [tabKey]: Math.max(1, Number(next) || 1) }
    })
  }, [])

  const getPage = useCallback(
    (tabKey) => pages[tabKey] ?? 1,
    [pages],
  )

  const resetPage = useCallback((tabKey) => {
    setPagesState((prev) => {
      const { [tabKey]: _, ...rest } = prev
      return rest
    })
  }, [])

  const value = { getPage, setPage, resetPage }
  return <PaginationContext.Provider value={value}>{children}</PaginationContext.Provider>
}

export function usePagination(tabKey) {
  const ctx = useContext(PaginationContext)
  if (!ctx) {
    throw new Error('usePagination must be used within PaginationProvider')
  }
  const page = ctx.getPage(tabKey)
  const setPage = useCallback((updater) => ctx.setPage(tabKey, updater), [ctx, tabKey])
  const resetPage = useCallback(() => ctx.resetPage(tabKey), [ctx, tabKey])
  return [page, setPage, resetPage]
}
