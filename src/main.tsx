import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import lucideInit from '@/lib/lucide-init'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

requestAnimationFrame(() => lucideInit())
