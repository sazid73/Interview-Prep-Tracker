import React from 'react';
import './Topbar.css';

const Topbar = ({ currentView, currentUser, currentUserRole, toggleMenu, onLogout }) => {
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
