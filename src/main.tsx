import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App.tsx'
import './index.css'
import StoreProvider from './app/providers/StoreProvider.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StoreProvider>
       <App />
    </StoreProvider>
  </React.StrictMode>,
)

window.lostarkAPI.onMainProcessMessage((message) => {
  console.log(message)
})
