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

  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState([]);

  const fetchNotifications = async () => {
    try {
      const [tasksRes, stdRes] = await Promise.all([
        fetch(`${API_BASE}/api/tasks`),
        fetch(`${API_BASE}/api/students`)
      ]);
      
      if (!tasksRes.ok || !stdRes.ok) return; // Backend might be down
      
      const tasksData = await tasksRes.json();
      const stdData = await stdRes.json();
      
      const newNotifs = [];

      // WL Tasks
      const myWl = tasksData.filter(t => t.assignedTo === currentUser && t.taskType !== 'Chaser' && t.status !== 'completed');
      myWl.forEach(t => {
        newNotifs.push({
          id: t._id,
          type: 'wl',
          title: 'Weekly WL Assignment',
          message: `Lead: ${t.leadNum} (${t.shift})`,
          data: t
        });
      });
      
      // Chaser Dashboard Tasks
      const myChaser = tasksData.filter(t => t.assignedTo === currentUser && t.taskType === 'Chaser' && t.status !== 'completed');
      myChaser.forEach(t => {
        newNotifs.push({
          id: t._id,
          type: 'chaser',
          title: 'Assigned Chaser Task',
          message: `Lead: ${t.leadNum} - ${t.notes}`,
          data: t
        });
      });

      // DMS Tasks
      stdData.forEach(s => {
        if (s.recruiter === currentUser && s.appStatus !== 'Submitted') newNotifs.push({ id: `r-${s._id}`, type: 'dms', title: 'Recruitment Lead', message: `${s.name} (${s.studentId})` });
        if (s.chaser === currentUser && s.appStatus !== 'Submitted') newNotifs.push({ id: `c-${s._id}`, type: 'dms', title: 'Call & Book Prep', message: `${s.name} (${s.studentId})` });
        if (s.chasers?.cv === currentUser && s.appStatus !== 'Submitted' && !s.tasksCompleted?.cv) newNotifs.push({ id: `cv-${s._id}`, type: 'dms', dmsType: 'cv', studentId: s._id, tasksCompleted: s.tasksCompleted, title: 'CV Review', message: `${s.name} (${s.studentId})` });
        if (s.chasers?.ps === currentUser && s.appStatus !== 'Submitted' && !s.tasksCompleted?.ps) newNotifs.push({ id: `ps-${s._id}`, type: 'dms', dmsType: 'ps', studentId: s._id, tasksCompleted: s.tasksCompleted, title: 'PS Review', message: `${s.name} (${s.studentId})` });
        if (s.chasers?.qa === currentUser && s.appStatus !== 'Submitted' && !s.tasksCompleted?.qa) newNotifs.push({ id: `qa-${s._id}`, type: 'dms', dmsType: 'qa', studentId: s._id, tasksCompleted: s.tasksCompleted, title: 'QA Check', message: `${s.name} (${s.studentId})` });
        if (s.chasers?.sub === currentUser && s.appStatus !== 'Submitted' && !s.tasksCompleted?.sub) newNotifs.push({ id: `sub-${s._id}`, type: 'dms', dmsType: 'sub', studentId: s._id, tasksCompleted: s.tasksCompleted, title: 'Submission & QC', message: `${s.name} (${s.studentId})` });
        if (s.chasers?.sfe === currentUser && !['SFE submitted', 'SFE approved', 'SFE Rejected', 'Ineligible for SFE'].includes(s.sfeStatus)) newNotifs.push({ id: `sfe-${s._id}`, type: 'dms', title: 'SFE Officer', message: `${s.name} (${s.studentId})` });
      });

      setNotifications(newNotifs);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  React.useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleUpdateWlTaskStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkDmsTaskDone = async (studentId, currentTasksCompleted, taskType) => {
    try {
      const newTasksCompleted = { ...(currentTasksCompleted || {}), [taskType]: true };
      const res = await fetch(`${API_BASE}/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasksCompleted: newTasksCompleted })
      });
      if (res.ok) fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={toggleMenu}>☰</button>
        <div className="breadcrumb">
          <h3>{viewName}</h3>
          <span>Home / {viewName}</span>
        </div>
      </div>
      
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
        <button className="theme-toggle">☀️ Light</button>
        
        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', position: 'relative', padding: '0.2rem' }}
          >
            🔔
            {notifications.length > 0 && (
              <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>
          
          {showNotifications && (
            <div style={{ position: 'absolute', top: '120%', right: 0, width: '350px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'hidden' }}>
              <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-hover)' }}>
                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Your Tasks</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{notifications.length} Pending</span>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                    All caught up!
                  </div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: n.type === 'wl' ? '#10b981' : n.type === 'chaser' ? '#f59e0b' : '#8b5cf6', background: n.type === 'wl' ? 'rgba(16, 185, 129, 0.1)' : n.type === 'chaser' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(139, 92, 246, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{n.title}</span>
                      </div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{n.message}</div>
                      
                      {n.type === 'wl' || n.type === 'chaser' ? (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={() => handleUpdateWlTaskStatus(n.data._id, 'completed')} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>✓ Mark Done</button>
                        </div>
                      ) : n.dmsType ? (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button onClick={() => handleMarkDmsTaskDone(n.studentId, n.tasksCompleted, n.dmsType)} style={{ background: '#10b981', color: 'white', border: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>✓ Mark Done</button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                          Mark complete in Students DMS
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
