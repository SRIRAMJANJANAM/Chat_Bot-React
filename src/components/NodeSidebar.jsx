import React from 'react'

export default function NodeSidebar({ addNode }) {
  const items = [
    { type: 'greeting', label: 'Greeting' },
    { type: 'user_input', label: 'User Input' },
    { type: 'message', label: 'Message' },
    { type: 'branch', label: 'Branch' },
    { type: 'end', label: 'End' },
  ]

  const styles = {
    sidebar: {
      width: '220px',
      backgroundColor: '#2c3e50',
      color: '#ecf0f1',
      padding: '20px',
      fontFamily: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif`,
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
      boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      height: '100vh',
      boxSizing: 'border-box',
    },
    heading: {
      margin: '0 0 20px 0',
      fontWeight: '600',
      fontSize: '1.4rem',
      borderBottom: '1px solid #34495e',
      paddingBottom: '8px',
    },
    button: {
      backgroundColor: '#34495e',
      border: 'none',
      padding: '10px 15px',
      borderRadius: '5px',
      color: '#ecf0f1',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'background-color 0.2s, transform 0.15s',
      textAlign: 'left',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
    },
    buttonHover: {
      backgroundColor: '#3d566e',
      transform: 'scale(1.05)',
    },
    hint: {
      fontSize: '0.85rem',
      color: '#bdc3c7',
      marginTop: 'auto',
      lineHeight: '1.4',
      fontStyle: 'italic',
    },
  }

  // We need to handle hover styles for buttons, so let's use React's useState
  const [hovered, setHovered] = React.useState(null)

  return (
    <div style={styles.sidebar}>
      <h3 style={styles.heading}>Nodes</h3>
      {items.map((n) => (
        <button
          key={n.type}
          style={{
            ...styles.button,
            ...(hovered === n.type ? styles.buttonHover : {}),
          }}
          onClick={() => addNode(n.type)}
          onMouseEnter={() => setHovered(n.type)}
          onMouseLeave={() => setHovered(null)}
        >
          {n.label}
        </button>
      ))}
      <p style={styles.hint}>
        Select a node to edit its Label/Content. Double‑click an edge to set Branch value.
      </p>
    </div>
  )
}
