import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'

// Force auto-update of the service worker
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, reloading...');
    updateSW(true);
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
