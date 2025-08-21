import React, { useEffect, useState, useRef } from 'react'
import { API } from '../api'
import '../ChatModal.css'

export default function TestModal({ botId, onClose }) {
  const [message, setMessage] = useState('')
  const [transcript, setTranscript] = useState([])
  const [running, setRunning] = useState(false)
  const [currentNodeId, setCurrentNodeId] = useState(null)
  const scrollRef = useRef(null)

  // Auto scroll to bottom when transcript updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  // Load initial greeting
  useEffect(() => {
    async function fetchGreeting() {
      setRunning(true)
      try {
        const { data } = await API.post(`/chatbots/${botId}/run/`, {
          user_inputs: {},
          current_node_id: null,
        })

        // Add timestamp to each message
        const timestampedTranscript = data.transcript.map(m => ({
          ...m,
          timestamp: new Date().toISOString(),
        }))

        setTranscript(timestampedTranscript)
        setCurrentNodeId(data.current_node_id)
      } catch (error) {
        console.error('Error loading greeting:', error)
        setTranscript([{
          from: 'bot',
          text: 'Welcome! How can I help you today?',
          timestamp: new Date().toISOString()
        }])
      } finally {
        setRunning(false)
      }
    }
    fetchGreeting()
  }, [botId])

  // Utility delay function
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

  // Add bot messages one-by-one with delay
  const addBotMessagesWithDelay = async (messages) => {
    for (let msg of messages) {
      if (msg.from === 'bot') {
        setTranscript(prev => [
          ...prev,
          {
            ...msg,
            timestamp: new Date().toISOString()
          }
        ])
        await delay(2000)
      }
    }
  }

  const sendMessage = async () => {
    if (!message.trim() || running) return

    const userMessage = message
    setMessage('')
    setRunning(true)

    try {
      const { data } = await API.post(`/chatbots/${botId}/run/`, {
        user_inputs: { input: userMessage },
        current_node_id: currentNodeId,
      })

      // Add user message with timestamp
      setTranscript(prev => [
        ...prev,
        {
          from: 'user',
          text: userMessage,
          timestamp: new Date().toISOString()
        }
      ])

      // Add bot responses with delay
      await addBotMessagesWithDelay(data.transcript)

      setCurrentNodeId(data.current_node_id)
    } catch (error) {
      console.error('Error sending message:', error)
      setTranscript(prev => [
        ...prev,
        {
          from: 'bot',
          text: 'Sorry, an error occurred. Please try again.',
          timestamp: new Date().toISOString()
        }
      ])
    } finally {
      setRunning(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString()
  }

  return (
    <div className='modal-overlay'>
      <div className='chat-modal'>
        <div className='chat-header'>
          <div className='chat-bot-info'>
            <div className='bot-avatar'>🤖</div>
            <div className='bot-details'>
              <h3>Chat with Bot</h3>
              <div className='bot-status'>
                <span className={`status-indicator ${running ? 'typing' : 'online'}`}></span>
                {running ? 'Typing...' : 'Online'}
              </div>
            </div>
          </div>
          <button className='close-btn' onClick={onClose}>×</button>
        </div>

        <div className='chat-body' ref={scrollRef}>
          {transcript.map((m, i) => (
            <div key={i} className={`message ${m.from === 'bot' ? 'bot-message' : 'user-message'}`}>
              {m.from === 'bot' && <div className='message-avatar'>🤖</div>}
              <div className='message-content'>
                {m.from === 'bot' ? (
                  <span dangerouslySetInnerHTML={{ __html: m.text }} />
                ) : (
                  <span>{m.text}</span>
                )}
                <div className='message-timestamp'>{formatTimestamp(m.timestamp)}</div>
              </div>
              {m.from === 'user' && <div className='message-avatar'>👤</div>}
            </div>
          ))}

          {running && (
            <div className='message bot-message typing-indicator'>
              <div className='message-avatar'>🤖</div>
              <div className='message-content'>
                <div className='typing-dots'><span></span><span></span><span></span></div>
              </div>
            </div>
          )}
        </div>

        <div className='chat-input-container'>
          <div className='input-wrapper'>
            <input
              type='text'
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder='Type a message...'
              disabled={running}
              className='message-input'
            />
            <button
              onClick={sendMessage}
              disabled={running || !message.trim()}
              className='send-button'
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
