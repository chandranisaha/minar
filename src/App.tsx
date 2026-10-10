import { Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { FilmOverlay } from './art/FilmOverlay'
import { DevPanel } from './components/DevPanel'
import Landing from './screens/Landing'
import Story from './screens/Story'
import Dashboard from './screens/Dashboard'
import { isDevMode } from './lib/dev'
import { SCREENS } from './ui/screens'
import { ToastHost } from './ui/wire/ToastHost'

export default function App() {
  const loc = useLocation()
  return (
    <>
      <div className="fixed inset-0 overflow-hidden bg-water">
        {/* plain cross-fade between screens */}
        <div key={loc.pathname} className="fade-in absolute inset-0">
          <Suspense fallback={null}>
            <Routes location={loc}>
              <Route path="/" element={<Landing />} />
              <Route path="/story" element={<Story />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {SCREENS.map(({ path, Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
            </Routes>
          </Suspense>
        </div>
      </div>
      <FilmOverlay />
      <ToastHost />
      {isDevMode() && <DevPanel />}
    </>
  )
}
