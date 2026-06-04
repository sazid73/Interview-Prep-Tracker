import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Dashboard = ({ currentUserRole }) => {
  const [students, setStudents] = useState([]);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showAdminTaskModal, setShowAdminTaskModal] = useState(false);
  const [assignModal, setAssignModal] = useState({ show: false, student: null });
  const [adminTaskStatus, setAdminTaskStatus] = useState('Assigned'); // 'Assigned' or 'Completed'
  const [adminTaskTimeframe, setAdminTaskTimeframe] = useState('All'); // 'All', 'This Week', 'Today'
  const [showLogs, setShowLogs] = useState(false);
  const [analyticsMonth, setAnalyticsMonth] = useState('All');
  const [recruiterMonth, setRecruiterMonth] = useState('All');
  const [serverLogs, setServerLogs] = useState([]);
  const [logsTab, setLogsTab] = useState('Prep Tracker');
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logUserFilter, setLogUserFilter] = useState('');
  
  // Users List for Assignment
  const [allUsers, setAllUsers] = useState([]);
  
  // Admin Management State
  const [adminUsersList, setAdminUsersList] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('recruiter');
  const [newUserError, setNewUserError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(data => {
        setAdminUsersList(data);
        setAllUsers(data);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (showLogs) {
      fetch(`${API_BASE}/api/logs`)
        .then(res => res.json())
        .then(data => setServerLogs(data))
        .catch(err => console.error(err));
    }
  }, [showLogs]);

  useEffect(() => {
    // Legacy refresh logic if needed
  }, [showAdminModal, currentUserRole]);

  const handleDashboardChaserChange = async (type, val) => {
    const student = assignModal.student;
    const currentChasers = student.chasers || { cv: '', ps: '', sub: '', qa: '' };
    const newChasers = { ...currentChasers, [type]: val };
    
    setAssignModal({ show: true, student: { ...student, chasers: newChasers } });
    setStudents(students.map(s => s._id === student._id ? { ...s, chasers: newChasers } : s));
    
    try {
      await fetch(`${API_BASE}/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chasers: newChasers })
      });
      fetch(`${API_BASE}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: new Date().toLocaleString(), user: 'Admin', action: 'Student Edit', details: `Assigned ${type} to ${val} for ${student.name}` })
      }).catch(e => console.error(e));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAppStatusChange = async (newStatus) => {
    const student = assignModal.student;
    setStudents(students.map(s => s._id === student._id ? { ...s, appStatus: newStatus } : s));
    
    try {
      await fetch(`${API_BASE}/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appStatus: newStatus })
      });
    } catch (err) {
      console.error(err);
    }
    setAssignModal({ show: false, student: null });
  };

  // Admin Management Functions
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setNewUserError('');
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName, password: newUserPassword, role: newUserRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create user');
      
      setAdminUsersList(prev => [...prev, data.user].sort((a, b) => a.name.localeCompare(b.name)));
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('recruiter');
    } catch (err) {
      setNewUserError(err.message);
    }
  };

  const handleResetPassword = async (name) => {
    const newPassword = window.prompt(`Enter new password for ${name}:`);
    if (!newPassword || newPassword.trim() === '') return;
    
    try {
      await fetch(`${API_BASE}/api/users/${name}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      alert(`Password for ${name} updated successfully!`);
    } catch (err) {
      alert('Failed to update password');
    }
  };

  const handleDeleteUser = async (name) => {
    if (name.toLowerCase() === 'admin') return alert("Cannot delete the Genesis Admin!");
    if (!window.confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      await fetch(`${API_BASE}/api/users/${name}`, { method: 'DELETE' });
      setAdminUsersList(prev => prev.filter(u => u.name !== name));
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const getMonthYear = (dateString) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      if (isNaN(d)) return '';
      return `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
    } catch { return ''; }
  };

  const getWeekNumber = (dateString) => {
    let day = 1; let month = 0; let year = 2026;
    if (!dateString) return 1;
    try {
      const d = new Date(dateString);
      if (isNaN(d)) return 1;
      year = d.getFullYear(); month = d.getMonth(); day = d.getDate();
    } catch { return 1; }
    
    const firstDay = new Date(year, month, 1).getDay();
    const offset = firstDay === 0 ? 6 : firstDay - 1;
    return Math.max(1, Math.min(5, Math.ceil((day + offset) / 7)));
  };

  const uniqueMonths = [...new Set(students.map(s => getMonthYear(s.createdAt)).filter(Boolean))];
  const uniqueSessions = [...new Set(students.map(s => s.session).filter(Boolean))];

  const getAdminStats = () => {
    const stats = {};
    const filtered = analyticsMonth === 'All' ? students : students.filter(s => getMonthYear(s.createdAt) === analyticsMonth);
    
    filtered.forEach(s => {
      if (s.appStatus !== 'Submitted') return;
      const w = getWeekNumber(s.createdAt);
      if (w < 1 || w > 5) return;
      
      const chasers = s.chasers || {};
      ['cv', 'ps', 'qa', 'sub'].forEach(type => {
        const rawA = chasers[type];
        if (!rawA) return;
        const a = rawA.split(/[\s/]/)[0];
        
        if (!stats[a]) stats[a] = { 1: {cv:0, ps:0, qa:0, sub:0}, 2: {cv:0, ps:0, qa:0, sub:0}, 3: {cv:0, ps:0, qa:0, sub:0}, 4: {cv:0, ps:0, qa:0, sub:0}, 5: {cv:0, ps:0, qa:0, sub:0}, total: 0, totalCV: 0, totalPS: 0, totalQA: 0, totalSub: 0 };
        stats[a][w][type]++;
        stats[a].total++;
        if (type === 'cv') stats[a].totalCV++;
        if (type === 'ps') stats[a].totalPS++;
        if (type === 'qa') stats[a].totalQA++;
        if (type === 'sub') stats[a].totalSub++;
      });
    });
    return Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
  };
  
  const getRecruiterStats = () => {
    const stats = {};
    const filtered = recruiterMonth === 'All' ? students : students.filter(s => s.session === recruiterMonth);

    filtered.forEach(s => {
      const rawR = s.recruiter;
      if (!rawR) return;
      const r = rawR.split(/[\s/]/)[0]; // core name
      
      const w = getWeekNumber(s.createdAt);

      if (!stats[r]) {
        stats[r] = { 
          total: 0, 
          sources: { 'FB Leads': 0, 'TikTok Leads': 0, 'manual entry': 0, 'Others': 0 },
          outcomes: { 'Passed': 0, 'Fully Enrolled': 0, 'Failed': 0 },
          weeks: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }
      
      stats[r].total++;
      if (w >= 1 && w <= 5) stats[r].weeks[w]++;
      
      // Source tracking
      if (s.source === 'FB Leads' || s.source === 'TikTok Leads' || s.source === 'manual entry') {
        stats[r].sources[s.source]++;
      } else {
        stats[r].sources['Others']++;
      }

      // Outcomes tracking based on intStatus (or similar text)
      const status = (s.intStatus || '').toLowerCase();
      if (status.includes('fully enrolled') || status === 'enrolled') stats[r].outcomes['Fully Enrolled']++;
      else if (status.includes('passed')) stats[r].outcomes['Passed']++;
      else if (status.includes('failed')) stats[r].outcomes['Failed']++;
    });

    return Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
  };

  const adminStats = getAdminStats();
  const recruiterStats = getRecruiterStats();

  const prepLogs = serverLogs.filter(log => !log.action.includes('Student') && !log.action.includes('Interview '));
  const studentLogs = serverLogs.filter(log => log.action.includes('Student'));
  const interviewLogs = serverLogs.filter(log => log.action.includes('Interview '));

  const getActiveLogs = () => {
    let logs = [];
    if (logsTab === 'Students') logs = studentLogs;
    else if (logsTab === 'Interviews') logs = interviewLogs;
    else logs = prepLogs;

    if (logSearchTerm) {
      const term = logSearchTerm.toLowerCase();
      logs = logs.filter(l => 
        (l.action && l.action.toLowerCase().includes(term)) ||
        (l.details && l.details.toLowerCase().includes(term)) ||
        (l.user && l.user.toLowerCase().includes(term))
      );
    }
    
    if (logUserFilter) {
      logs = logs.filter(l => l.user === logUserFilter);
    }
    
    return logs;
  };

  const uniqueLogUsers = [...new Set(serverLogs.map(l => l.user).filter(Boolean))].sort();

  const colAwaitingDocs = students.filter(s => s.appStatus?.toLowerCase() === 'awaiting admin docs');
  const colAwaitingSub = students.filter(s => s.appStatus?.toLowerCase() === 'awaiting submission and qc' || s.appStatus?.toLowerCase() === 'awaiting submission');
  const colUrgent = students.filter(s => s.appStatus?.toLowerCase() === 'urgent submission');
  const colCompleted = students.filter(s => s.appStatus?.toLowerCase() === 'submitted' || s.appStatus?.toLowerCase() === 'completed');

  const renderStudentCard = (student, colColor) => (
    <div key={student._id} onClick={() => setAssignModal({ show: true, student })} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${colColor}`, cursor: 'pointer', marginBottom: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <strong style={{ color: 'var(--text-primary)' }}>{student.name}</strong>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{student.studentId}</span>
      </div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        {student.courseAndCampus1 && <div style={{ marginBottom: '4px' }}>🎓 {student.courseAndCampus1}</div>}
        {student.chasers && Object.keys(student.chasers).some(k => student.chasers[k]) && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {student.chasers.cv && <span style={{ background: '#3b82f6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>CV: {student.chasers.cv.split(' ')[0]}</span>}
            {student.chasers.ps && <span style={{ background: '#8b5cf6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>PS: {student.chasers.ps.split(' ')[0]}</span>}
            {student.chasers.qa && <span style={{ background: '#10b981', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>QA: {student.chasers.qa.split(' ')[0]}</span>}
            {student.chasers.sub && <span style={{ background: '#f59e0b', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>SUB: {student.chasers.sub.split(' ')[0]}</span>}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Dashboard Overview</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(currentUserRole === 'admin' || currentUserRole === 'super_admin') && (
            <button 
              onClick={() => setShowAdminModal(true)} 
              style={{ 
                background: '#ec4899', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', 
                borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
            >
              👥 Manage Access
            </button>
          )}
          <button 
            onClick={() => setShowAdminTaskModal(true)} 
            style={{ 
              background: '#10b981', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', 
              borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            🎯 Admin Legacy Dist.
          </button>
          <button 
            onClick={() => setShowRecruiterModal(true)} 
            style={{ 
              background: '#8b5cf6', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', 
              borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            📈 Recruiter Performance
          </button>
          <button 
            onClick={() => setShowAnalyticsModal(true)} 
            style={{ 
              background: '#3b82f6', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', 
              borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            📊 Admin App Analytics
          </button>
          <button 
            onClick={() => setShowLogs(true)} 
            style={{ 
              background: '#f59e0b', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', 
              borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}
          >
            📋 Activity Logs
          </button>
        </div>
      </div>

      {/* Admin Task Workflow Section */}
      <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '2rem' }}>
        <h3 style={{ marginTop: 0, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          👨‍💼 Admin Submission Workflow
        </h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Real-time tracking of application submissions. Click on a student card to assign tasks (CV, PS, QA, Sub) or change their status.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', overflowX: 'auto' }}>
          
          {/* Column 1: Awaiting Admin Docs */}
          <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#6b7280', borderBottom: '2px solid #6b7280', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Awaiting Admin Docs</span>
              <span style={{ background: '#6b7280', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{colAwaitingDocs.length}</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {colAwaitingDocs.map(s => renderStudentCard(s, '#6b7280'))}
            </div>
          </div>

          {/* Column 2: Awaiting Submission & QC */}
          <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Awaiting Sub & QC</span>
              <span style={{ background: '#3b82f6', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{colAwaitingSub.length}</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {colAwaitingSub.map(s => renderStudentCard(s, '#3b82f6'))}
            </div>
          </div>

          {/* Column 3: Urgent Submission */}
          <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#ef4444', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Urgent Submission</span>
              <span style={{ background: '#ef4444', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{colUrgent.length}</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {colUrgent.map(s => renderStudentCard(s, '#ef4444'))}
            </div>
          </div>

          {/* Column 4: Completed */}
          <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Completed</span>
              <span style={{ background: '#10b981', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{colCompleted.length}</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {colCompleted.map(s => renderStudentCard(s, '#10b981'))}
            </div>
          </div>
        </div>
      </div>

      {showLogs && (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: 'none' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Shift Activity Logs</h3>
              <button onClick={() => setShowLogs(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', padding: '0 1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              {['Prep Tracker', 'Students', 'Interviews'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setLogsTab(tab)}
                  style={{ 
                    background: 'transparent', 
                    border: 'none', 
                    color: logsTab === tab ? '#3b82f6' : 'var(--text-secondary)',
                    fontWeight: logsTab === tab ? 'bold' : 'normal',
                    padding: '0.5rem 0',
                    borderBottom: logsTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  {tab === 'Prep Tracker' ? '📅' : tab === 'Students' ? '🧑‍🎓' : '🎤'} {tab}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', padding: '0 1.5rem', marginBottom: '1rem' }}>
              <input 
                type="text" 
                placeholder="Search logs by action or details..." 
                value={logSearchTerm}
                onChange={e => setLogSearchTerm(e.target.value)}
                style={{ flex: 1, padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
              <select 
                value={logUserFilter}
                onChange={e => setLogUserFilter(e.target.value)}
                style={{ padding: '0.6rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
              >
                <option value="">All Users</option>
                {uniqueLogUsers.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            
            <div className="dms-modal-body" style={{ display: 'block', flex: 1, padding: '0 1.5rem 1.5rem 1.5rem', overflowY: 'auto' }}>
              {getActiveLogs().length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>No activities recorded yet for {logsTab}.</p>
              ) : (
                <ul style={{ padding: 0, listStyle: 'none', margin: 0 }}>
                  {getActiveLogs().map(log => (
                    <li key={log._id || log.id} style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)', marginBottom: '0.5rem', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <strong style={{ color: '#3b82f6' }}>{log.user}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.timestamp}</span>
                      </div>
                      <div>
                        <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', background: 'var(--bg-surface-hover)', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, marginRight: '0.75rem', border: '1px solid var(--border-color)' }}>
                          {log.action}
                        </span>
                        <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem' }}>{log.details}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {showAnalyticsModal && (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Admin App Analytics</h3>
                <select 
                  value={analyticsMonth} 
                  onChange={e => setAnalyticsMonth(e.target.value)}
                  style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px' }}
                >
                  <option value="All">All Months</option>
                  {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <button onClick={() => setShowAnalyticsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            
            <div className="dms-modal-body" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
              {adminStats.map(([admin, data]) => (
                <div key={admin} style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, color: '#f3f4f6', fontSize: '1.1rem' }}>{admin}</h3>
                    <div style={{ background: '#374151', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', color: '#9ca3af' }}>
                      {data.total} Tasks Completed
                    </div>
                  </div>
                  
                  {/* KPI Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#60a5fa' }}>{data.totalCV}</div>
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase' }}>CVs</div>
                    </div>
                    <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#a78bfa' }}>{data.totalPS}</div>
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase' }}>PS</div>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fbbf24' }}>{data.totalSub}</div>
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase' }}>Submits</div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#34d399' }}>{data.totalQA}</div>
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase' }}>QAs</div>
                    </div>
                  </div>

                  {/* Weekly Breakdown Table */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map(w => (
                      <div key={w} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '8px', textAlign: 'center', borderBottom: '1px solid #374151', paddingBottom: '4px' }}>W{w}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', textAlign: 'center' }}>
                          <span style={{ color: data[w].cv > 0 ? '#60a5fa' : '#4b5563' }} title="CV">{data[w].cv}</span>
                          <span style={{ color: data[w].ps > 0 ? '#a78bfa' : '#4b5563' }} title="PS">{data[w].ps}</span>
                          <span style={{ color: data[w].sub > 0 ? '#fbbf24' : '#4b5563' }} title="Submission">{data[w].sub}</span>
                          <span style={{ color: data[w].qa > 0 ? '#34d399' : '#4b5563' }} title="QA">{data[w].qa}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {adminStats.length === 0 && <p style={{color: '#9ca3af', textAlign: 'center', gridColumn: '1 / -1'}}>No completed applications found for this month.</p>}
            </div>
          </div>
        </div>
      )}

      {showRecruiterModal && (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '1000px', width: '90%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Recruiter Performance (Leads & Conversion)</h3>
                <select 
                  value={recruiterMonth} 
                  onChange={e => setRecruiterMonth(e.target.value)}
                  style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px' }}
                >
                  <option value="All">All Sessions</option>
                  {uniqueSessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button onClick={() => setShowRecruiterModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            
            <div className="dms-modal-body" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '2rem' }}>
              {recruiterStats.map(([recruiter, data]) => (
                <div key={recruiter} style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, color: '#f3f4f6', fontSize: '1.2rem' }}>{recruiter}</h3>
                    <div style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 }}>
                      {data.total} Total Leads
                    </div>
                  </div>
                  
                  {/* Advanced CSS Bar Graphs for Outcomes */}
                  <div style={{ marginBottom: '2rem' }}>
                    <h4 style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Recruiter Outcomes (Performance)</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {/* Passed */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem', color: '#e5e7eb' }}>
                          <span>Passed</span>
                          <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{data.outcomes['Passed']}</span>
                        </div>
                        <div style={{ height: '8px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${data.total ? (data.outcomes['Passed']/data.total)*100 : 0}%`, background: '#60a5fa', borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                        </div>
                      </div>

                      {/* Fully Enrolled */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem', color: '#e5e7eb' }}>
                          <span>Fully Enrolled</span>
                          <span style={{ color: '#10b981', fontWeight: 'bold' }}>{data.outcomes['Fully Enrolled']}</span>
                        </div>
                        <div style={{ height: '8px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${data.total ? (data.outcomes['Fully Enrolled']/data.total)*100 : 0}%`, background: '#10b981', borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                        </div>
                      </div>

                      {/* Failed */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem', color: '#e5e7eb' }}>
                          <span>Failed</span>
                          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{data.outcomes['Failed']}</span>
                        </div>
                        <div style={{ height: '8px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${data.total ? (data.outcomes['Failed']/data.total)*100 : 0}%`, background: '#ef4444', borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Source Breakdown */}
                    <div>
                      <h4 style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Lead Sources</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#d1d5db' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Facebook:</span> <span>{data.sources['FB Leads']}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>TikTok:</span> <span>{data.sources['TikTok Leads']}</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Manual:</span> <span>{data.sources['manual entry']}</span></div>
                      </div>
                    </div>

                    {/* Weekly Acquisition Velocity */}
                    <div>
                      <h4 style={{ color: '#9ca3af', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Weekly Velocity</h4>
                      <div style={{ display: 'flex', alignItems: 'flex-end', height: '50px', gap: '4px', borderBottom: '1px solid #374151' }}>
                        {[1, 2, 3, 4, 5].map(w => {
                          const maxW = Math.max(...Object.values(data.weeks), 1);
                          const h = (data.weeks[w] / maxW) * 100;
                          return (
                            <div key={w} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                              <span style={{ fontSize: '0.6rem', color: '#9ca3af' }}>{data.weeks[w]}</span>
                              <div style={{ width: '100%', height: `${h}%`, background: '#60a5fa', borderRadius: '2px 2px 0 0', minHeight: data.weeks[w] > 0 ? '4px' : '0' }}></div>
                              <span style={{ fontSize: '0.55rem', color: '#6b7280' }}>W{w}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {recruiterStats.length === 0 && <p style={{color: '#9ca3af', textAlign: 'center', gridColumn: '1 / -1'}}>No leads generated for this month.</p>}
            </div>
          </div>
        </div>
      )}

      {showAdminModal && (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '700px', width: '90%', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>👥 Manage Access & Roles</h3>
              <button onClick={() => setShowAdminModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            
            <div className="dms-modal-body" style={{ padding: '1.5rem' }}>
              <div style={{ background: 'var(--bg-surface-hover)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Provision New Account</h3>
                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Employee Name</label>
                    <input required value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="e.g. John Doe" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Temporary Password</label>
                    <input required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="password" placeholder="Password" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Professional Role</label>
                    <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                      <option value="super_admin">Super Admin (Full System Control)</option>
                      <option value="admin">Admin</option>
                      <option value="admins for task assigns">Admins for Task Assigns</option>
                      <option value="team leader">Team Leader</option>
                      <option value="asst. team leader">Asst. Team Leader</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="chaser">Chaser</option>
                      <option value="prep coach">Prep Coach</option>
                      <option value="standard">Standard User</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" style={{ width: '100%', padding: '0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>+ Provision User</button>
                  </div>
                </form>
                {newUserError && <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem' }}>{newUserError}</div>}
              </div>

              <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Active Directory</h3>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', color: 'var(--text-primary)' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '0.5rem' }}>Employee Name</th>
                    <th style={{ padding: '0.5rem' }}>Professional Role</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsersList.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{u.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <select
                          value={u.role || 'standard'}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            fetch(`${API_BASE}/api/users/${u.name}/role`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ role: newRole })
                            }).then(() => {
                              setAdminUsersList(prev => prev.map(usr => usr.name === u.name ? { ...usr, role: newRole } : usr));
                            });
                          }}
                          style={{ padding: '0.3rem', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="manager">Manager / Team Lead</option>
                          <option value="compliance">Compliance & QA Officer</option>
                          <option value="recruiter">Senior Recruiter</option>
                          <option value="admin">Legacy Admin</option>
                          <option value="special">Legacy Special (Paint)</option>
                          <option value="standard">Standard User</option>
                          <option value="viewer">Read-Only / Guest</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleResetPassword(u.name)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Reset Pass</button>
                          <button onClick={() => handleDeleteUser(u.name)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Revoke</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAdminTaskModal && (() => {
        const distribution = {
          adminCV: {},
          adminPS: {},
          adminQA: {},
          adminSub: {}
        };

        const add = (dept, user, task) => {
          if (!user || user === 'Click to assign') return;
          if (!distribution[dept][user]) distribution[dept][user] = [];
          distribution[dept][user].push(task);
        };

        const isTaskMatchingFilters = (s) => {
          // Status filter
          const isCompleted = s.appStatus === 'Submitted' || s.appStatus === 'Completed';
          if (adminTaskStatus === 'Assigned' && isCompleted) return false;
          if (adminTaskStatus === 'Completed' && !isCompleted) return false;

          // Timeframe filter
          if (adminTaskTimeframe !== 'All') {
            const taskDate = new Date(s.updatedAt || s.createdAt || Date.now());
            const today = new Date();
            if (adminTaskTimeframe === 'Today') {
              if (taskDate.toDateString() !== today.toDateString()) return false;
            } else if (adminTaskTimeframe === 'This Week') {
              const diffTime = Math.abs(today - taskDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays > 7) return false;
            }
          }
          return true;
        };

        students.forEach(s => {
          if (!isTaskMatchingFilters(s)) return;
          const taskObj = { id: s.studentId, name: s.name, status: s.appStatus };
          if (s.chasers) {
            add('adminCV', s.chasers.cv, taskObj);
            add('adminPS', s.chasers.ps, taskObj);
            add('adminQA', s.chasers.qa, taskObj);
            add('adminSub', s.chasers.sub, taskObj);
          }
        });

        const renderDeptBlock = (title, color, dataMap) => (
          <div style={{ background: 'var(--bg-surface-hover)', padding: '1.5rem', borderRadius: '12px', border: `1px solid ${color}40`, marginBottom: '1.5rem' }}>
            <h4 style={{ color, marginTop: 0, marginBottom: '1rem', borderBottom: `2px solid ${color}40`, paddingBottom: '0.5rem', fontSize: '1.1rem' }}>{title}</h4>
            {Object.keys(dataMap).length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No {adminTaskStatus.toLowerCase()} tasks found.</p> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {Object.entries(dataMap).map(([user, tasks]) => (
                  <div key={user} style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{user}</strong>
                      <span style={{ background: color, color: '#fff', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{tasks.length}</span>
                    </div>
                    <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {tasks.map((t, idx) => <div key={idx} style={{ marginBottom: '0.2rem' }}>• {t.name} ({t.id})</div>)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

        return (
          <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '1200px', width: '95%', maxHeight: '90vh', overflowY: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
              <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎯 Admin Task Distribution (Legacy View)
                </h3>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <select 
                    value={adminTaskStatus} 
                    onChange={e => setAdminTaskStatus(e.target.value)}
                    style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
                  >
                    <option value="Assigned">Live / Assigned</option>
                    <option value="Completed">Completed (Submitted)</option>
                  </select>
                  
                  <select 
                    value={adminTaskTimeframe} 
                    onChange={e => setAdminTaskTimeframe(e.target.value)}
                    style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
                  >
                    <option value="All">All Time</option>
                    <option value="This Week">Last 7 Days</option>
                    <option value="Today">Today</option>
                  </select>

                  <button onClick={() => setShowAdminTaskModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', marginLeft: '1rem' }}>✗</button>
                </div>
              </div>
              
              <div className="dms-modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                {renderDeptBlock('Admin Tasks (CV Review)', '#3b82f6', distribution.adminCV)}
                {renderDeptBlock('Admin Tasks (PS Review)', '#8b5cf6', distribution.adminPS)}
                {renderDeptBlock('Admin Tasks (Submission & QC)', '#f59e0b', distribution.adminSub)}
                {renderDeptBlock('Admin Tasks (QA Check)', '#10b981', distribution.adminQA)}
              </div>
            </div>
          </div>
        );
      })()}

      {assignModal.show && (
        <div className="dms-modal-overlay" style={{ zIndex: 3000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '500px', width: '90%', padding: '2rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Assign Admin Tasks</h3>
              <button onClick={() => setAssignModal({ show: false, student: null })} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Assign tasks for <strong style={{ color: 'var(--text-primary)' }}>{assignModal.student.name}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { type: 'cv', label: '📝 CV Writer' },
                { type: 'ps', label: '📄 PS Writer' },
                { type: 'qa', label: '✅ QA Officer' },
                { type: 'sub', label: '📤 Submission Officer' }
              ].map(({ type, label }) => (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{label}</label>
                  <select 
                    value={(assignModal.student.chasers && assignModal.student.chasers[type]) || ''}
                    onChange={(e) => handleDashboardChaserChange(type, e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', width: '200px' }}
                  >
                    <option value="">Unassigned</option>
                    {allUsers.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Change Application Status</h4>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['Awaiting Admin Docs', 'Awaiting Submission and QC', 'Urgent Submission', 'Completed'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleAppStatusChange(status)}
                    style={{ 
                      padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
                      background: assignModal.student.appStatus?.toLowerCase() === status.toLowerCase() ? '#3b82f6' : 'var(--bg-surface)',
                      color: assignModal.student.appStatus?.toLowerCase() === status.toLowerCase() ? '#fff' : 'var(--text-primary)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignModal({ show: false, student: null })} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Done</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
