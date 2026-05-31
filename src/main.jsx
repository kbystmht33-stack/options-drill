import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import Drill from './Drill'
import Quiz from './Quiz'

const navStyle = `
  .app-nav {
    display: flex; align-items: center; gap: 0;
    background: #111; border-bottom: 1px solid #1e1e1e;
    padding: 0 18px;
  }
  .app-nav a {
    display: block; padding: 12px 16px;
    font-family: 'DM Mono', monospace; font-size: 11px;
    letter-spacing: .15em; text-transform: uppercase;
    color: #444; text-decoration: none;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
    transition: color .15s;
  }
  .app-nav a:hover { color: #888; }
  .app-nav a.active { color: #10B981; border-bottom-color: #10B981; }
`

function App() {
  return (
    <HashRouter>
      <style>{navStyle}</style>
      <nav className="app-nav">
        <NavLink to="/" end>フラッシュカード</NavLink>
        <NavLink to="/quiz">問題集</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Drill />} />
        <Route path="/quiz" element={<Quiz />} />
      </Routes>
    </HashRouter>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
