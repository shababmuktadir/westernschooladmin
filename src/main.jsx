import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import '@/styles/index.css'
import { Buffer } from 'buffer';

// Buffer polyfill for Vite
if (typeof window !== 'undefined') {
  window.global = window;
  window.Buffer = window.Buffer || Buffer;
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)