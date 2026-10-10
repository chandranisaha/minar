import { Route, Routes, useLocation } from 'react-router-dom'
import { FilmOverlay } from './art/FilmOverlay'
import Landing from './screens/Landing'
import Story from './screens/Story'
import Play from './screens/Play'
import Dashboard from './screens/Dashboard'

export default function App() {
  const loc = useLocation()
  return (
    <>
      <div className="fixed inset-0 overflow-hidden bg-water">
        {/* plain cross-fade between screens */}
        <div key={loc.pathname} className="fade-in absolute inset-0">
          <Routes location={loc}>
            <Route path="/" element={<Landing />} />
            <Route path="/story" element={<Story />} />
            <Route path="/play/:pillar" element={<Play />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </div>
      <FilmOverlay />
    </>
  )
}
