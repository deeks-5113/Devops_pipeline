import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster 
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--color-dark-surface)',
          color: 'var(--color-dark-text)',
          border: '1px solid var(--color-dark-border)'
        }
      }} 
    />
  </StrictMode>,
)
