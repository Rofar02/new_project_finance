import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'

console.log('🚀 Starting app...')

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

try {
  console.log('✅ Root element found, rendering app...')
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('✅ App rendered successfully')
} catch (error) {
  console.error('❌ Failed to render app:', error)
  rootElement.innerHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 20px;
      text-align: center;
    ">
      <div>
        <h1 style="font-size: 24px; margin-bottom: 10px;">Ошибка загрузки</h1>
        <p style="color: #999; margin-bottom: 20px;">Проверьте консоль браузера (F12)</p>
        <pre style="background: #1C1C1E; padding: 10px; border-radius: 8px; font-size: 12px; text-align: left; margin: 20px 0; overflow: auto;">
${error instanceof Error ? error.message : String(error)}
        </pre>
        <button 
          onclick="location.reload()" 
          style="
            background: #8E44FD;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 14px;
            font-size: 16px;
            cursor: pointer;
          "
        >
          Обновить страницу
        </button>
      </div>
    </div>
  `
}

