import React, { useEffect, useState } from 'react'
import { API } from './api'
import Builder from './components/Builder'
import TestModal from './components/TestModal' // Keep name as TestModal

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useParams,
} from 'react-router-dom'

function Home() {
  const [botId, setBotId] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    ;(async () => {
      const list = await API.get('/chatbots/')
      if (list.data.length) {
        setBotId(list.data[0].id)
        return
      }
      const created = await API.post('/chatbots/', { name: 'FAQ Bot' })
      setBotId(created.data.id)
    })()
  }, [])

  if (!botId) return <div>Preparing bot…</div>

  return (
    <div className='app'>
      <header>
        <h1>AI Bot Builder</h1>
        <button onClick={() => navigate(`/chat/${botId}`)}>Test</button>
      </header>
      <Builder botId={botId} />
    </div>
  )
}

function ChatPage() {
  const { botId } = useParams()
  const navigate = useNavigate()

  return <TestModal botId={botId} onClose={() => navigate('/')} />
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/chat/:botId' element={<ChatPage />} />
      </Routes>
    </Router>
  )
}
