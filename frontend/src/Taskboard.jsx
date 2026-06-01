import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Taskboard = ({ currentUser }) => {
  const [wlTasks, setWlTasks] = useState([]);
  const [chaserTasks, setChaserTasks] = useState([]);
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
      setWlTasks(tasksData.filter(t => t.assignedTo === currentUser));

      // Fetch Student Lead Chaser Tasks
      const stdRes = await fetch(`${API_BASE}/api/students`);
      const stdData = await stdRes.json();
      
      const myChaserTasks = [];
      stdData.forEach(s => {
        if (s.chasers?.cv === currentUser) myChaserTasks.push({ ...s, taskType: 'CV Review' });
        if (s.chasers?.ps === currentUser) myChaserTasks.push({ ...s, taskType: 'PS Review' });
        if (s.chasers?.qa === currentUser) myChaserTasks.push({ ...s, taskType: 'QA Check' });
        if (s.chasers?.sub === currentUser) myChaserTasks.push({ ...s, taskType: 'Submission' });
      });
      setChaserTasks(myChaserTasks);

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
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ borderBottom: '2px solid var(--border-focus)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
            Weekly WL Assignments ({wlTasks.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {wlTasks.map(t => (
              <div key={t._id} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${t.status === 'completed' ? '#10b981' : t.status === 'working' ? '#f59e0b' : '#3b82f6'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Lead: {t.leadNum}</strong>
                  <select 
                    value={t.status} 
                    onChange={e => handleUpdateWlTaskStatus(t._id, e.target.value)}
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
                  <p style={{ margin: '0.2rem 0' }}>📅 Time: {t.startDateAndTime} - {t.endTime}</p>
                </div>
              </div>
            ))}
            {wlTasks.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No WL tasks assigned.</p>}
          </div>
        </div>

        {/* Chaser Tasks Column */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ borderBottom: '2px solid #8b5cf6', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
            Chaser Tasks ({chaserTasks.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {chaserTasks.map((t, idx) => (
              <div key={`${t._id}-${idx}`} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{t.name} ({t.studentId})</strong>
                  <span style={{ background: '#8b5cf6', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {t.taskType}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <p style={{ margin: '0.2rem 0' }}>🏫 {t.courseAndCampus1}</p>
                  <p style={{ margin: '0.2rem 0' }}>📱 {t.mobile || 'No Mobile'}</p>
                  <p style={{ margin: '0.2rem 0' }}>📧 {t.email || 'No Email'}</p>
                  <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic', color: '#10b981' }}>Current App Status: {t.appStatus}</p>
                </div>
              </div>
            ))}
            {chaserTasks.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No Chaser tasks assigned.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Taskboard;
