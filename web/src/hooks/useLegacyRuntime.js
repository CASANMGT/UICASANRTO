import { useEffect, useState } from 'react'
import { ensureLegacyRuntime, getState, subscribe } from '../bridge/legacyRuntime'

export function useLegacyRuntime() {
  const [ready, setReady] = useState(false)
  const [state, setState] = useState(getState())
  const [error, setError] = useState('')

  useEffect(() => {
    let unsub = () => {}
    ensureLegacyRuntime()
      .then(() => {
        setReady(true)
        setState(getState())
        unsub = subscribe(setState)
      })
      .catch((err) => {
        setError(err.message || 'Failed to initialize legacy runtime')
      })
    return () => unsub()
  }, [])

  return { ready, state, error }
}
