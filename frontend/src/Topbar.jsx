import React from 'react';
import './Topbar.css';

const Topbar = ({ currentView, currentUser, toggleMenu }) => {
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
      
      <div className="topbar-right">
        <button className="theme-toggle">☀️ Light</button>
        <div className="user-profile">
          <div className="avatar">
            {currentUser ? currentUser.substring(0, 2).toUpperCase() : 'U'}
          </div>
          <span className="user-name">{currentUser}</span>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
