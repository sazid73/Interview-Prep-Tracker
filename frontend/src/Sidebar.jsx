import React from 'react';
import './Sidebar.css';

const Sidebar = ({ currentView, setCurrentView, mobileOpen, setMobileOpen }) => {
  const navItems = [
    { section: 'MAIN', items: [
      { id: 'dashboard', label: 'Dashboard', icon: '⏱️' }
    ]},
    { section: 'STUDENTS', items: [
      { id: 'students', label: 'Students', icon: '👤' },
      { id: 'student_activity', label: 'Student Activity', icon: '📋' },
      { id: 'interviews', label: 'Interviews', icon: '💬' },
      { id: 'prep_interviews', label: 'Prep Interviews', icon: '🎯' },
      { id: 'prep_interview_activity', label: 'Prep Interview Activity', icon: '📊' },
      { id: 'interview_status', label: 'Interview Status', icon: '✓' }
    ]},
    { section: 'ACADEMIC', items: [
      { id: 'course_campus', label: 'Course and Campus', icon: '🏛️' },
      { id: 'awarding_body', label: 'Awarding Body', icon: '🎓' },
      { id: 'subjects', label: 'Subjects', icon: '📚' },
      { id: 'sessions', label: 'Sessions', icon: '📅' }
    ]}
  ];

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999}}></div>}
      <div className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
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
