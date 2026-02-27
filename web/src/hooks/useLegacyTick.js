import { useEffect, useState } from 'react'
import { subscribe } from '../bridge/legacyRuntime'

export function useLegacyTick() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const unsub = subscribe(() => setTick((value) => value + 1))
    return () => unsub()
  }, [])

  return tick
}
