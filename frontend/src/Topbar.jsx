import React from 'react';
import './Topbar.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Topbar = ({ currentView, currentUser, currentUserRole, toggleMenu, onLogout }) => {
  const [presence, setPresence] = React.useState('working');
  const [shiftStart, setShiftStart] = React.useState('');
  const [shiftEnd, setShiftEnd] = React.useState('');

  React.useEffect(() => {
    if (currentUser) {
      fetch(`${API_BASE}/api/users`)
        .then(res => res.json())
        .then(data => {
          const me = data.find(u => u.name === currentUser);
          if (me) {
            setPresence(me.presence || 'working');
            setShiftStart(me.shiftStart || '');
            setShiftEnd(me.shiftEnd || '');
          }
        })
        .catch(err => console.error(err));
    }
  }, [currentUser]);

  const handleProfileUpdate = async (field, value) => {
    if (field === 'presence') setPresence(value);
    if (field === 'shiftStart') setShiftStart(value);
    if (field === 'shiftEnd') setShiftEnd(value);
    
    try {
      await fetch(`${API_BASE}/api/users/${currentUser}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      // Optionally fire a global event so WeeklyWL can update instantly without prop drilling
      window.dispatchEvent(new CustomEvent('user-profile-updated'));
    } catch (err) {
      console.error('Failed to update profile', err);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
            <select 
              value={presence} 
              onChange={e => handleProfileUpdate('presence', e.target.value)}
              style={{ padding: '0.3rem', borderRadius: '4px', background: presence === 'working' ? '#10b981' : presence === 'leave' ? '#ef4444' : presence === 'break' ? '#f59e0b' : '#8b5cf6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <option value="working">Working</option>
              <option value="break">Break</option>
              <option value="prep">Prep</option>
              <option value="leave">Leave</option>
            </select>
            <input 
              type="text" 
              placeholder="Start Time (e.g. 10 AM)" 
              value={shiftStart}
              onChange={e => setShiftStart(e.target.value)}
              onBlur={e => handleProfileUpdate('shiftStart', e.target.value)}
              style={{ width: '80px', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>-</span>
            <input 
              type="text" 
              placeholder="End Time (e.g. 6 PM)" 
              value={shiftEnd}
              onChange={e => setShiftEnd(e.target.value)}
              onBlur={e => handleProfileUpdate('shiftEnd', e.target.value)}
              style={{ width: '80px', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }}
            />
          </div>
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
