import { useNavigate } from 'react-router-dom'
import { useGame } from '../store/game'

export default function Story() {
  const nav = useNavigate()
  const setSeen = useGame((s) => s.setStorySeen)
  const setPersona = useGame((s) => s.setPersona)
  return (
    <button
      type="button"
      className="ink-btn m-8"
      onClick={() => {
        setPersona('college')
        setSeen(true)
        nav('/')
      }}
    >
      temp skip
    </button>
  )
}
