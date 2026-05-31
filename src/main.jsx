import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Drill from './Drill'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Drill />
  </StrictMode>,
)
