import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root')

  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    console.log('[Renderer] React app mounted')
  } else {
    console.error('[Renderer] Root element not found')
  }
})
