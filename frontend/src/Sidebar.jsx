import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentView, setCurrentView, isOpen, setSidebarOpen }) => {
  const navItems = [
    { section: 'MAIN', items: [
      { id: 'dashboard', label: 'Dashboard', icon: '⏱️' }
    ]},
    { section: 'STUDENTS', items: [
      { id: 'students', label: 'Students', icon: '👤' },
      { id: 'student_activity', label: 'Student Activity', icon: '📋' },
      { id: 'prep_interviews', label: 'Prep Interviews', icon: '🎯' },
      { id: 'interviews', label: 'Interviews', icon: '💬' },
      { id: 'interview_status', label: 'Interview Status', icon: '✓' }
    ]},
    { section: 'ACADEMIC', items: [
      { id: 'course_campus', label: 'Course and Campus', icon: '🏛️' },
      { id: 'sessions', label: 'Sessions', icon: '📅' }
    ]},
    { section: 'MANAGEMENT', items: [
      { id: 'weekly_wl', label: 'Weekly WL', icon: '📝' },
      { id: 'taskboard', label: 'Taskboard', icon: '📋' }
    ]}
  ];

  return (
    <>
      <div className={`sidebar-overlay ${isOpen ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <div className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-logo">
        <h2>RAY</h2>
        <p>EDUCATION & RECRUITMENT</p>
        <span>Consultation</span>
      </div>
      <div className="sidebar-nav">
        {navItems.map((group, idx) => (
          <div key={idx} className="nav-group">
            <h4 className="nav-group-title">{group.section}</h4>
            <ul>
              {group.items.map(item => (
                <li key={item.id}>
                  <button 
                    className={`nav-btn ${currentView === item.id ? 'active' : ''}`}
                    onClick={() => setCurrentView(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
    </>
  );
};

export default Sidebar;
