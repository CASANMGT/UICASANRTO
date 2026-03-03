import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PaginationProvider } from './context/PaginationContext'
import './legacy-theme.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PaginationProvider>
      <App />
    </PaginationProvider>
  </StrictMode>,
)
