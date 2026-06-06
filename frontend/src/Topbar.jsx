import SearchableSelect from './SearchableSelect';
import React from 'react';
import './Topbar.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Topbar = ({ currentView, currentUser, currentUserRole, currentUserData, toggleMenu, onLogout }) => {
  const [presence, setPresence] = React.useState('working');
  const [shiftStart, setShiftStart] = React.useState('');
  const [shiftEnd, setShiftEnd] = React.useState('');
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const [theme, setTheme] = React.useState(() => localStorage.getItem('trackerTheme') || 'dark');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('trackerTheme', theme);
  }, [theme]);

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
        if (s.chasers?.sfe === currentUser && !['SFE submitted', 'SFE approved', 'SFE Rejected', 'Ineligible for SFE'].includes(s.sfeStatus)) newNotifs.push({ id: `sfe-${s._id}`, type: 'dms', dmsType: 'sfe', studentId: s._id, title: 'SFE Officer', message: `${s.name} (${s.studentId})` });
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
    if (status === 'completed' && !window.confirm("Are you sure you want to mark this task as done?")) return;
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
    if (!window.confirm("Are you sure you want to mark this task as done?")) return;
    try {
      let updatePayload = {};
      if (taskType === 'sfe') {
        updatePayload = { sfeStatus: 'SFE submitted' };
      } else {
        const sRes = await fetch(`${API_BASE}/api/students`);
        const sData = await sRes.json();
        const student = sData.find(s => s._id === studentId);
        
        const newTasksCompleted = { ...(student?.tasksCompleted || {}), [taskType]: true };
        updatePayload = { tasksCompleted: newTasksCompleted };
        
        if (student && student.chasers) {
          const isCvDone = student.chasers.cv ? newTasksCompleted.cv : true;
          const isPsDone = student.chasers.ps ? newTasksCompleted.ps : true;
          const isQaDone = student.chasers.qa ? newTasksCompleted.qa : true;
          const isSubDone = student.chasers.sub ? newTasksCompleted.sub : true;
          
          if (isCvDone && isPsDone && isQaDone && isSubDone) {
            updatePayload.appStatus = 'Submitted';
          }
        }
      }
      const res = await fetch(`${API_BASE}/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload)
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

        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', background: showProfileMenu ? 'var(--bg-surface-hover)' : 'transparent', transition: 'background 0.2s' }}
          >
            <div className="avatar" style={{ background: 'var(--accent-color)', color: '#fff', width: '35px', height: '35px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {currentUser ? currentUser.substring(0, 2).toUpperCase() : 'U'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="user-name" style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{currentUser}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {currentUserRole ? currentUserRole.replace('_', ' ') : 'Standard'}
              </span>
            </div>
          </div>

          {showProfileMenu && (
            <div style={{ position: 'absolute', top: '120%', right: '0', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1rem', width: '280px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 99999 }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{currentUser}</div>
                <div style={{ color: 'var(--accent-color)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'capitalize' }}>Role: {currentUserRole ? currentUserRole.replace('_', ' ') : 'Standard'}</div>
                {currentUserData?.abilities && currentUserData.abilities.length > 0 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    <strong>Abilities:</strong> {currentUserData.abilities.join(', ')}
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Current Status</label>
                  <select 
                    value={presence} 
                    onChange={e => handleProfileUpdate('presence', e.target.value)}
                    style={{ width: '100%', marginTop: '0.3rem', padding: '0.5rem', borderRadius: '6px', background: presence === 'working' ? '#10b981' : presence === 'leave' ? '#ef4444' : presence === 'break' ? '#f59e0b' : '#8b5cf6', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', appearance: 'auto' }}
                  >
                    <option value="working">Working</option>
                    <option value="break">Break</option>
                    <option value="prep">Prep</option>
                    <option value="leave">Leave</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Work Time</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
                    <input 
                      type="text" 
                      placeholder="Start" 
                      value={shiftStart}
                      onChange={e => setShiftStart(e.target.value)}
                      onBlur={e => handleProfileUpdate('shiftStart', e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                    <input 
                      type="text" 
                      placeholder="End" 
                      value={shiftEnd}
                      onChange={e => setShiftEnd(e.target.value)}
                      onBlur={e => handleProfileUpdate('shiftEnd', e.target.value)}
                      style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>Theme Mode</label>
                  <button 
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                </div>
              </div>

              <button 
                onClick={onLogout} 
                style={{ width: '100%', padding: '0.6rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
