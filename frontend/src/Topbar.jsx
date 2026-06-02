import React from 'react';
import './Topbar.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Topbar = ({ currentView, currentUser, currentUserRole, toggleMenu, onLogout }) => {
  const [presence, setPresence] = React.useState('working');

  React.useEffect(() => {
    if (currentUser) {
      fetch(`${API_BASE}/api/users`)
        .then(res => res.json())
        .then(data => {
          const me = data.find(u => u.name === currentUser);
          if (me && me.presence) setPresence(me.presence);
        })
        .catch(err => console.error(err));
    }
  }, [currentUser]);

  const handlePresenceChange = async (e) => {
    const newPresence = e.target.value;
    setPresence(newPresence);
    try {
      await fetch(`${API_BASE}/api/users/${currentUser}/presence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presence: newPresence })
      });
    } catch (err) {
      console.error('Failed to update presence', err);
    }
  };

  const formatViewName = (viewId) => {
    return viewId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const viewName = formatViewName(currentView);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={toggleMenu}>☰</button>
        <div className="breadcrumb">
          <h3>{viewName}</h3>
          <span>Home / {viewName}</span>
        </div>
      </div>
      
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button className="theme-toggle">☀️ Light</button>
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="avatar">
            {currentUser ? currentUser.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="user-name" style={{ fontWeight: 'bold' }}>{currentUser}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {currentUserRole ? currentUserRole.replace('_', ' ') : 'Standard'}
            </span>
          </div>
          <select 
            value={presence} 
            onChange={handlePresenceChange}
            style={{ marginLeft: '1rem', padding: '0.3rem', borderRadius: '4px', background: presence === 'working' ? '#10b981' : presence === 'leave' ? '#ef4444' : presence === 'break' ? '#f59e0b' : '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <option value="working">Working</option>
            <option value="break">Break</option>
            <option value="prep">Prep</option>
            <option value="leave">Leave</option>
          </select>
          <button 
            onClick={onLogout} 
            style={{ 
              marginLeft: '0.5rem', padding: '0.4rem 0.8rem', background: '#ef4444', 
              color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
