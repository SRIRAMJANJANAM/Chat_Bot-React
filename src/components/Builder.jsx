import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { API } from '../api';
import NodeSidebar from './NodeSidebar';
import { useNavigate } from 'react-router-dom';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

let idCounter = 1;
const genId = () => String(++idCounter);

export default function Builder({ botId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selected, setSelected] = useState(null);
  const [originalSelected, setOriginalSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge({
          ...params,
          label: '+',
          style: { stroke: '#333' },
          markerEnd: { type: 'arrowclosed' },
        }, eds)
      ),
    []
  );

  const addNode = (type) => {
    const id = genId();
    setNodes((nds) =>
      nds.concat({
        id,
        type: 'default',
        position: { x: 120 + Math.random() * 320, y: 80 + Math.random() * 280 },
        data: {
          label: `${type} ${id}`,
          content: ({
            greeting: 'Welcome! What topic do you need help with?',
            user_input: 'Type: order / refund',
            message: 'Here is some information…',
            branch: '',
            end: 'Goodbye!',
          })[type] || '',
        },
        _ntype: type,
      })
    );
  };

  const onNodeClick = (_, node) => {
    if ((node.data.label || '').trim().toLowerCase() === 'test') {
      return navigate(`/chat/${botId}`);
    }
    setOriginalSelected(JSON.parse(JSON.stringify(node)));
    setSelected(node);
  };

  const onNodeDoubleClick = (_, node) => {
    if (window.confirm(`Delete node "${node.data.label}"?`)) {
      setNodes((nds) => nds.filter((n) => n.id !== node.id));
      setEdges((eds) =>
        eds.filter((e) => e.source !== node.id && e.target !== node.id)
      );
      if (selected?.id === node.id) {
        setSelected(null);
        setOriginalSelected(null);
      }
    }
  };

  const updateSelected = (field, value) => {
    if (!selected) return;
    setSelected((s) => ({
      ...s,
      data: { ...s.data, [field]: value },
    }));
  };

  const saveNodeChanges = () => {
    if (!selected) return;
    setNodes((nds) =>
      nds.map((n) =>
        n.id === selected.id
          ? { ...n, data: { ...n.data, label: selected.data.label, content: selected.data.content } }
          : n
      )
    );
    setSelected(null);
    setOriginalSelected(null);
  };

  const cancelNodeChanges = () => {
    setSelected(originalSelected ? JSON.parse(JSON.stringify(originalSelected)) : null);
    setTimeout(() => {
      setSelected(null);
      setOriginalSelected(null);
    }, 100);
  };

  const onEdgeDoubleClick = (evt, edge) => {
    const action = prompt(`Edit edge:\n\nCurrent label: ${edge.label || ''}\nType '+' to connect or '-' to remove`);
    if (action === '-') {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    } else if (action !== null) {
      setEdges((eds) =>
        eds.map((e) => (e.id === edge.id ? { ...e, label: action || '+' } : e))
      );
    }
  };

  const saveGraph = async () => {
    setLoading(true);
    try {
      await API.post(`/chatbots/${botId}/save_graph/`, {
        nodes: nodes.map((n) => ({ id: n.id, _ntype: n._ntype, position: n.position, data: n.data })),
        edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label || '+' })),
      });
      alert('Saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Error saving: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadGraph = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/chatbots/${botId}/`);
      const nds = data.nodes.map((n) => ({
        id: String(n.id),
        position: { x: n.x, y: n.y },
        data: {
          label: n.label || `${n.node_type} ${n.id}`,
          content: n.content || '',
        },
        type: 'default',
        _ntype: n.node_type,
      }));
      const eds = data.connections.map((c, idx) => ({
        id: `edge-${idx}`,
        source: String(c.from_node),
        target: String(c.to_node),
        label: c.condition_value || '+',
      }));
      setNodes(nds);
      setEdges(eds);
      idCounter = Math.max(1000, ...nds.map((n) => Number(n.id)));
      setSelected(null);
      setOriginalSelected(null);
      alert('Loaded successfully!');
    } catch (error) {
      console.error(error);
      alert('Error loading: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [botId]);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: "'Inter', sans-serif",
      backgroundColor: '#f8fafc',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Dot pattern background */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
        backgroundSize: '20px 20px', opacity: 0.15, zIndex: 0, pointerEvents: 'none',
      }} />

      {/* Sidebar */}
      <div style={{
        width: '280px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 20px rgba(0,0,0,0.08)', zIndex: 10, position: 'relative',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white',
        }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.4183 16.9706 20 12 20..." stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Chatbot Builder
          </h2>
          <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
            Design your conversation flow
          </p>
        </div>

        {/* Actions */}
        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={saveGraph} disabled={loading} style={{
              flex: 1, padding: '10px 16px',
              background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff', border: 'none', borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: '600',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.2s, box-shadow 0.2s',
            }} onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')} onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'none')}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button onClick={loadGraph} disabled={loading} style={{
              flex: 1, padding: '10px 16px',
              backgroundColor: loading ? '#cbd5e1' : '#fff',
              color: loading ? '#64748b' : '#475569', border: '1px solid #e2e8f0',
              borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
              fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s',
            }} onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')} onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'none')}>
              {loading ? 'Loading...' : 'Reload'}
            </button>
          </div>
        </div>

        {/* Node Library */}
        <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '0.875rem', fontWeight: '600', color: '#334155', textTransform: 'uppercase' }}>
            Node Library
          </h3>
          <NodeSidebar addNode={addNode} />
        </div>

        {/* Stats */}
        <div style={{ padding: '16px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#64748b', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Bot ID:</span><span style={{ fontWeight: '600' }}>{botId}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Nodes:</span><span style={{ fontWeight: '600' }}>{nodes.length}</span>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, position: 'relative', margin: '16px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden', zIndex: 5 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onEdgeDoubleClick={onEdgeDoubleClick}
          connectionLineStyle={{ stroke: '#6366f1', strokeWidth: 2 }}
          connectionLineType="smoothstep"
          fitView
        >
          <Background color="#cbd5e1" gap={32} variant="dots" size={1} />
          <Controls style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' }} />
        </ReactFlow>
      </div>

      {/* Inspector */}
      <div style={{
        width: '320px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column',
        boxShadow: '0 0 20px rgba(0,0,0,0.08)', zIndex: 10, position: 'relative',
      }}>
        <div style={{
          padding: '24px', borderBottom: '1px solid #f1f5f9',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white',
        }}>
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228..." stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Node Properties
          </h3>
        </div>

        {selected ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>Label</label>
              <input
                value={selected.data.label || ''}
                onChange={(e) => updateSelected('label', e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0',
                  borderRadius: '8px', fontSize: '0.95rem', backgroundColor: '#f8fafc', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366f1';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.2)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '24px', flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.875rem', color: '#334155' }}>Content</label>
              <ReactQuill
                theme="snow"
                value={selected.data.content || ''}
                onChange={(value) => updateSelected('content', value)}
                modules={{ toolbar: [['bold', 'italic'], [{ list: 'ordered' }, { list: 'bullet' }], ['clean']] }}
                formats={['bold', 'italic', 'list', 'bullet']}
                style={{ height: '200px', marginBottom: '40px', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #6366f1', marginBottom: '24px' }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                <strong style={{ color: '#334155' }}>Usage:</strong> Content is shown for Greeting/Message, used as prompt for User Input, and End message.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button onClick={saveNodeChanges} style={{
                flex: 1, padding: '12px 16px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem',
                fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'transform 0.2s, box-shadow 0.2s',
              }} onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}>
                Save
              </button>
              <button onClick={cancelNodeChanges} style={{
                flex: 1, padding: '12px 16px', backgroundColor: '#fff', color: '#475569',
                border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem',
                fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'transform 0.2s, box-shadow 0.2s',
              }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.backgroundColor = '#f8fafc'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.backgroundColor = '#fff'; }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', padding: '40px', textAlign: 'center' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <path d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.4183..." stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ margin: '16px 0 0', fontSize: '0.875rem', fontWeight: '500', color: '#64748b' }}>
              Select a node to edit its properties
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              Click any node in the canvas to view and edit its settings
            </p>
          </div>
        )}
      </div>
    </div>
  );
}