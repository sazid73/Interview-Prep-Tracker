import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Taskboard = ({ currentUser }) => {
  const [wlTasks, setWlTasks] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyTasks();
  }, [currentUser]);

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      // Fetch Weekly WL Tasks
      const tasksRes = await fetch(`${API_BASE}/api/tasks`);
      const tasksData = await tasksRes.json();
      const myWl = tasksData.filter(t => t.assignedTo === currentUser);
      
      setWlTasks(myWl.filter(t => t.status !== 'completed'));
      setHistoryTasks(myWl.filter(t => t.status === 'completed'));

      setWlTasks(myWl.filter(t => t.status !== 'completed'));
      setHistoryTasks(myWl.filter(t => t.status === 'completed'));

    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdateWlTaskStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setWlTasks(wlTasks.map(t => t._id === id ? data.task : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'white' }}>Loading tasks...</div>;

  return (
    <div style={{ padding: '2rem', color: 'var(--text-primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ marginBottom: '2rem' }}>📋 My Taskboard</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        
        {/* WL Tasks Column */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div>
            <h3 style={{ borderBottom: '2px solid var(--border-focus)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
              Active Weekly WL ({wlTasks.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {wlTasks.map(t => (
                <div key={t._id} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${t.status === 'working' ? '#10b981' : '#f59e0b'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>Lead: {t.leadNum}</strong>
                    <select 
                      value={t.status} 
                      onChange={e => {
                        handleUpdateWlTaskStatus(t._id, e.target.value);
                        if (e.target.value === 'completed') fetchMyTasks();
                      }}
                      style={{ padding: '0.2rem', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="working">Working</option>
                      <option value="completed">Completed</option>
                      <option value="Leave">Leave</option>
                    </select>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <p style={{ margin: '0.2rem 0' }}>🕒 Shift: {t.shift} ({t.day})</p>
                    <p style={{ margin: '0.2rem 0' }}>📅 Time: {t.startDateAndTime || 'Not Set'} - {t.endTime || 'Not Set'}</p>
                  </div>
                </div>
              ))}
              {wlTasks.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No active WL tasks.</p>}
            </div>
          </div>

          <div>
            <h3 style={{ borderBottom: '2px solid #6b7280', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: '#9ca3af' }}>
              Work History (Completed)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {historyTasks.map(t => (
                <div key={t._id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', borderLeft: '4px solid #6b7280', opacity: 0.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong>Lead: {t.leadNum}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>✓ Completed</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <p style={{ margin: '0' }}>Shift: {t.shift} ({t.day})</p>
                  </div>
                </div>
              ))}
              {historyTasks.length === 0 && <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No completed history.</p>}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Taskboard;
