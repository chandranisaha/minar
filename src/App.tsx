import { Route, Routes } from 'react-router-dom'
import { FilmOverlay } from './art/FilmOverlay'
import { IrisProvider } from './components/Iris'
import Landing from './screens/Landing'
import Story from './screens/Story'
import Play from './screens/Play'
import Dashboard from './screens/Dashboard'
import Kit from './screens/Kit'

export default function App() {
  return (
    <IrisProvider>
      <div className="fixed inset-0 overflow-hidden bg-ink">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/story" element={<Story />} />
          <Route path="/play/:pillar" element={<Play />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/kit" element={<Kit />} />
        </Routes>
      </div>
      <FilmOverlay />
    </IrisProvider>
  )
}
