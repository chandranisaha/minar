import { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { FilmOverlay } from './art/FilmOverlay'
import { DevPanel } from './components/DevPanel'
import { IrisProvider } from './components/Iris'
import Landing from './screens/Landing'
import Story from './screens/Story'
import Dashboard from './screens/Dashboard'
import Kit from './screens/Kit'
import { isDevMode } from './lib/dev'
import { SCREENS } from './ui/screens'
import { ToastHost } from './ui/wire/ToastHost'

export default function App() {
  return (
    <IrisProvider>
      <div className="fixed inset-0 overflow-hidden bg-ink">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/story" element={<Story />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/kit" element={<Kit />} />
            {SCREENS.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
          </Routes>
        </Suspense>
      </div>
      <FilmOverlay />
      <ToastHost />
      {isDevMode() && <DevPanel />}
    </IrisProvider>
  )
}
