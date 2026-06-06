import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Dashboard = ({ currentUserRole }) => {
  const [students, setStudents] = useState([]);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const [showAdminTaskModal, setShowAdminTaskModal] = useState(false);
  const [showAdminWorkflowModal, setShowAdminWorkflowModal] = useState(false);
  const [showSfeWorkflowModal, setShowSfeWorkflowModal] = useState(false);
  const [showIntWorkflowModal, setShowIntWorkflowModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showRecruiterTaskModal, setShowRecruiterTaskModal] = useState(false);
  const [assignModal, setAssignModal] = useState({ show: false, student: null });
  const [sfeAssignModal, setSfeAssignModal] = useState({ show: false, student: null });
  const [adminTaskStatus, setAdminTaskStatus] = useState('Assigned'); // 'Assigned' or 'Completed'
  const [adminTaskTimeframe, setAdminTaskTimeframe] = useState('All'); // 'All', 'This Week', 'Today'
  const [showLogs, setShowLogs] = useState(false);
  const [analyticsMonth, setAnalyticsMonth] = useState('All');
  const [analyticsWeek, setAnalyticsWeek] = useState('All');
  const [completedMonthFilter, setCompletedMonthFilter] = useState('All');
  const [completedWeekFilter, setCompletedWeekFilter] = useState('All');
  const [modalFilterMonth, setModalFilterMonth] = useState('All');
  const [modalFilterWeek, setModalFilterWeek] = useState('All');
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

  const [miInterviews, setMiInterviews] = useState([]);
  const [prepGrid, setPrepGrid] = useState([]);
  const [showPrepModal, setShowPrepModal] = useState(false);
  
  const [tasks, setTasks] = useState([]);
  const [recruiterTaskFilter, setRecruiterTaskFilter] = useState('All');
  
  // Chaser Tasks State
  const [showChaserTaskModal, setShowChaserTaskModal] = useState(false);
  const [chaserTaskFilter, setChaserTaskFilter] = useState('All');
  const [showCreateChaserTaskModal, setShowCreateChaserTaskModal] = useState(false);
  const [newChaserTask, setNewChaserTask] = useState({ assignedTo: '', leadNum: '', notes: '' });
  
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [showOnlyUrgentSfeSubmitted, setShowOnlyUrgentSfeSubmitted] = useState(false);

  // Clear search term when a modal is closed/opened
  useEffect(() => {
    setModalSearchTerm('');
    setShowOnlyUrgentSfeSubmitted(false);
  }, [showSfeWorkflowModal, showIntWorkflowModal, showAdminTaskModal, showRecruiterTaskModal, showAlertsModal, showChaserTaskModal, showPrepModal]);

  useEffect(() => {
    const t = Date.now();
    fetch(`${API_BASE}/api/students?t=${t}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/users?t=${t}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setAdminUsersList(data);
        setAllUsers(data);
      })
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/interviews?t=${t}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setMiInterviews(data))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/grid?t=${t}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
         let allPreps = [];
         Object.keys(data).forEach(key => {
            // "interview-YYYY-M-D-TIME"
            if (key.startsWith('interview-')) {
               const slots = data[key].slots || [];
               slots.forEach(slot => {
                  if (slot && slot.text && slot.text.trim() !== '') {
                     allPreps.push({ ...slot, keyStr: key.replace('interview-', '') });
                  }
               });
            }
         });
         setPrepGrid(allPreps);
      })
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/tasks?t=${t}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setTasks(data))
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
  }, [currentUserRole]);

  const handleDashboardChaserChange = async (type, val) => {
    const student = assignModal.student;
    let newStatus = student.appStatus;
    if (newStatus !== 'Submitted' && newStatus !== 'Completed' && newStatus?.toLowerCase() !== 'urgent submission') {
      newStatus = 'Submission ongoing';
    }
    const currentChasers = student.chasers || { cv: '', ps: '', sub: '', qa: '' };
    const newChasers = { ...currentChasers, [type]: val };
    
    setAssignModal({ show: true, student: { ...student, chasers: newChasers, appStatus: newStatus } });
    setStudents(students.map(s => s._id === student._id ? { ...s, chasers: newChasers, appStatus: newStatus } : s));
    
    try {
      await fetch(`${API_BASE}/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chasers: newChasers, appStatus: newStatus })
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

  const handleSfeAssignDropdown = async (val) => {
    const student = sfeAssignModal.student;
    if (!student) return;
    
    // Only automatically change status to 'ongoing' if it was in 'Assign for SFE' or blank.
    const newStatus = (!student.sfeStatus || student.sfeStatus === 'Assign for SFE') ? 'SFE ongoing' : student.sfeStatus;
    
    const currentChasers = student.chasers || { cv: '', ps: '', sub: '', qa: '', sfe: '' };
    const newChasers = { ...currentChasers, sfe: val };
    
    setSfeAssignModal({ show: true, student: { ...student, chasers: newChasers, sfeStatus: newStatus } });
    setStudents(students.map(s => s._id === student._id ? { ...s, chasers: newChasers, sfeStatus: newStatus } : s));
    
    try {
      await fetch(`${API_BASE}/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chasers: newChasers, sfeStatus: newStatus })
      });
      fetch(`${API_BASE}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: new Date().toLocaleString(), user: 'Admin', action: 'Student Edit', details: `Assigned SFE to ${val || 'Unassigned'} for ${student.name}` })
      }).catch(e => console.error(e));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateChaserTask = async (e) => {
    e.preventDefault();
    if (!newChaserTask.assignedTo) return alert('Please select a Chaser');
    
    try {
      const taskData = {
        ...newChaserTask,
        taskType: 'Chaser',
        day: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        shift: 'DAY TIME',
        status: 'pending',
        assignedBy: 'Admin', // In real app, use currentUser
        startDateAndTime: new Date().toISOString()
      };
      
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      
      const savedTask = await res.json();
      setTasks(prev => [...prev, savedTask]);
      setShowCreateChaserTaskModal(false);
      setNewChaserTask({ assignedTo: '', leadNum: '', notes: '' });
      
      fetch(`${API_BASE}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: new Date().toLocaleString(), user: 'Admin', action: 'Task Assigned', details: `Assigned Chaser Task for Lead ${newChaserTask.leadNum} to ${newChaserTask.assignedTo}` })
      }).catch(e => console.error(e));
      
    } catch (err) {
      console.error(err);
      alert('Failed to assign task');
    }
  };

  const handleAppStatusChange = async (newStatus) => {
    if (newStatus === 'Submitted') {
      if (!window.confirm("Are you sure you want to mark this submission as completed? This action will finalize the application status.")) return;
    }
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

  const handleSfeStatusAction = async (newStatus, confirmMsg) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    const student = sfeAssignModal.student;
    
    setStudents(students.map(s => s._id === student._id ? { ...s, sfeStatus: newStatus } : s));
    
    try {
      await fetch(`${API_BASE}/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sfeStatus: newStatus })
      });
      fetch(`${API_BASE}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: new Date().toLocaleString(), user: 'Admin', action: 'Student Edit', details: `Updated SFE Status to ${newStatus} for ${student.name}` })
      }).catch(e => console.error(e));
    } catch (err) {
      console.error(err);
    }
    setSfeAssignModal({ show: false, student: null });
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

  const getWeekNumber = (dateVal) => {
    let day = 1; let month = 0; let year = 2026;
    if (!dateVal) return 1;
    try {
      const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
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
    const filtered = students.filter(s => {
      if (analyticsMonth !== 'All' && getMonthYear(s.createdAt) !== analyticsMonth) return false;
      if (analyticsWeek !== 'All' && getWeekNumber(s.createdAt).toString() !== analyticsWeek) return false;
      return true;
    });
    
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

  const colAwaitingAssignments = students.filter(s => s.appStatus?.toLowerCase() === 'assign for submission');
  const colSubmissionOngoing = students.filter(s => s.appStatus?.toLowerCase() === 'submission ongoing' && s.isUrgent !== true && s.appStatus?.toLowerCase() !== 'urgent submission');
  const colUrgent = students.filter(s => (s.isUrgent === true || s.appStatus?.toLowerCase() === 'urgent submission') && s.appStatus !== 'Submitted' && s.appStatus !== 'Completed');
  const colCompleted = students.filter(s => s.appStatus?.toLowerCase() === 'submitted' || s.appStatus?.toLowerCase() === 'completed');

  const colSfeAwaiting = students.filter(s => s.sfeStatus === 'Assign for SFE');
  const colSfeOngoing = students.filter(s => s.sfeStatus === 'SFE ongoing');
  const colSfeUrgent = students.filter(s => s.sfeStatus === 'Urgent SFE' || s.sfeStatus === 'Urgent SFE ongoing');
  const colSfeSubmitted = students.filter(s => s.sfeStatus === 'SFE submitted');
  const colSfeApproved = students.filter(s => s.sfeStatus === 'SFE approved');

  const isDateMissed = (dateStr) => dateStr && new Date(dateStr) < new Date(new Date().setHours(0,0,0,0));
  const colIntPassed = miInterviews.filter(i => (i.status || '').toLowerCase() === 'pass');
  const colIntFailed = miInterviews.filter(i => (i.status || '').toLowerCase() === 'failed');
  const colIntPending = miInterviews.filter(i => ((i.status || '').toLowerCase() === 'pending' || (i.status || '').toLowerCase() === 'rescheduled') && !isDateMissed(i.date));
  const colIntMissed = miInterviews.filter(i => ((i.status || '').toLowerCase() === 'missed') || (((i.status || '').toLowerCase() === 'pending' || (i.status || '').toLowerCase() === 'rescheduled') && isDateMissed(i.date)));



  const isCurrentWeek = (dStr) => {
    if (!dStr) return false;
    const parts = dStr.split('-');
    if (parts.length < 3) return false;
    
    const dObj = new Date(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
    const now = new Date();
    now.setHours(0,0,0,0);
    
    const currentDay = now.getDay();
    const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return dObj >= monday && dObj <= sunday;
  };

  const prepGridCurrentWeek = prepGrid.filter(p => {
    const parts = p.keyStr.split('-');
    return isCurrentWeek(`${parts[0]}-${parts[1]}-${parts[2]}`);
  });

  const prepsDone = prepGridCurrentWeek.filter(p => (p.status || '').toLowerCase() === 'done' || (p.status || '').toLowerCase() === 'pass');
  const prepsMissed = prepGridCurrentWeek.filter(p => (p.status || '').toLowerCase() === 'missed');
  const prepsRescheduled = prepGridCurrentWeek.filter(p => (p.status || '').toLowerCase() === 'rescheduled');

  const prepTotal = prepsDone.length + prepsMissed.length + prepsRescheduled.length;
  const prepCompletionRate = prepTotal > 0 ? Math.round((prepsDone.length / prepTotal) * 100) : 0;

  const prepAnalytics = { bookedBy: {}, doneBy: {} };
  prepGridCurrentWeek.forEach(p => {
    if (!p.text || p.text.trim() === '') return;
    const parts = p.text.split('-');
    const employeeName = parts.length > 0 ? parts[parts.length - 1].trim() : 'Unknown';
    
    if (!prepAnalytics.bookedBy[employeeName]) prepAnalytics.bookedBy[employeeName] = [];
    prepAnalytics.bookedBy[employeeName].push(p);

    if ((p.status || '').toLowerCase() === 'done' || (p.status || '').toLowerCase() === 'pass') {
      if (!prepAnalytics.doneBy[employeeName]) prepAnalytics.doneBy[employeeName] = [];
      prepAnalytics.doneBy[employeeName].push(p);
    }
  });

  const sortedPrepBookers = Object.entries(prepAnalytics.bookedBy).sort((a, b) => b[1].length - a[1].length);
  const sortedPrepDoneBy = Object.entries(prepAnalytics.doneBy).sort((a, b) => b[1].length - a[1].length);

  const sfeTotal = colSfeAwaiting.length + colSfeOngoing.length + colSfeUrgent.length + colSfeSubmitted.length + colSfeApproved.length;
  const sfeCompletionRate = sfeTotal > 0 ? Math.round((colSfeApproved.length / sfeTotal) * 100) : 0;

  const intTotal = colIntPassed.length + colIntFailed.length + colIntMissed.length;
  const intCompletionRate = intTotal > 0 ? Math.round((colIntPassed.length / intTotal) * 100) : 0;

  const applyModalFilter = (list, dateExtractor, searchFields = ['name', 'studentId', 'studentName']) => {
    return list.filter(item => {
      if (modalSearchTerm) {
        const term = modalSearchTerm.toLowerCase();
        const matchesSearch = searchFields.some(field => {
          if (item[field] && typeof item[field] === 'string') {
            return item[field].toLowerCase().includes(term);
          }
          return false;
        });
        if (!matchesSearch) return false;
      }
      const dStr = dateExtractor(item);
      if (!dStr) return modalFilterMonth === 'All' && modalFilterWeek === 'All';
      
      const dObj = new Date(dStr);
      if (isNaN(dObj.getTime())) return modalFilterMonth === 'All' && modalFilterWeek === 'All';

      if (modalFilterMonth !== 'All' && dObj.toLocaleString('default', { month: 'short' }) !== modalFilterMonth) return false;
      if (modalFilterWeek !== 'All' && getWeekNumber(dObj).toString() !== modalFilterWeek.replace('Week ', '')) return false;
      
      return true;
    });
  };

  const colAlertRecruiter = students.filter(s => s.recruiter && (Date.now() - new Date(s.updatedAt || s.createdAt).getTime()) > 15 * 86400000 && s.appStatus !== 'Submitted');
  const colAlertChaser = students.filter(s => s.chaser && (Date.now() - new Date(s.updatedAt || s.createdAt).getTime()) > 3 * 86400000 && s.appStatus !== 'Submitted');

  const renderStudentCard = (student, colColor, onClickOverride = null, mode = 'admin') => {
    const isUrgent = student.appStatus?.toLowerCase() === 'urgent submission';
    let urgentNote = '';
    if (isUrgent && student.appStatusHistory && student.appStatusHistory.length > 0) {
      const urgentEntries = student.appStatusHistory.filter(h => h.status === 'Urgent Submission');
      if (urgentEntries.length > 0) {
        urgentNote = urgentEntries[urgentEntries.length - 1].note;
      }
    }

    let urgentSfeNote = '';
    if (student.sfeStatus === 'Urgent SFE' && student.sfeStatusHistory && student.sfeStatusHistory.length > 0) {
      const sfeEntries = student.sfeStatusHistory.filter(h => h.status === 'Urgent SFE');
      if (sfeEntries.length > 0) {
        urgentSfeNote = sfeEntries[sfeEntries.length - 1].note;
      }
    }

    const isClickable = onClickOverride !== false;
    const handleClick = () => {
      if (onClickOverride === false) return; // Do nothing
      if (onClickOverride) onClickOverride(student);
      else setAssignModal({ show: true, student });
    };

    return (
      <div key={student._id} onClick={handleClick} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${colColor}`, cursor: isClickable ? 'pointer' : 'default', marginBottom: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{student.name}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{student.studentId}</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {student.courseAndCampus1 && <div style={{ marginBottom: '4px' }}>🎓 {student.courseAndCampus1}</div>}
          {student.chasers && Object.keys(student.chasers).some(k => student.chasers[k]) && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {mode === 'sfe' ? (
                student.chasers.sfe && <span style={{ background: '#10b981', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>SFE: {student.chasers.sfe.split(' ')[0]}</span>
              ) : (
                <>
                  {student.chasers.cv && <span style={{ background: student.tasksCompleted?.cv ? '#10b981' : '#4b5563', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>CV: {student.chasers.cv.split(' ')[0]} {student.tasksCompleted?.cv && '✅'}</span>}
                  {student.chasers.ps && <span style={{ background: student.tasksCompleted?.ps ? '#10b981' : '#4b5563', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>PS: {student.chasers.ps.split(' ')[0]} {student.tasksCompleted?.ps && '✅'}</span>}
                  {student.chasers.qa && <span style={{ background: student.tasksCompleted?.qa ? '#10b981' : '#4b5563', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>QA: {student.chasers.qa.split(' ')[0]} {student.tasksCompleted?.qa && '✅'}</span>}
                  {student.chasers.sub && <span style={{ background: student.tasksCompleted?.sub ? '#10b981' : '#4b5563', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>SUB: {student.chasers.sub.split(' ')[0]} {student.tasksCompleted?.sub && '✅'}</span>}
                </>
              )}
            </div>
          )}
          {isUrgent && urgentNote && (
            <div style={{ marginTop: '0.8rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', borderRadius: '4px', fontSize: '0.75rem', color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>
              🚨 {urgentNote}
            </div>
          )}
          {student.sfeStatus === 'Urgent SFE' && mode === 'sfe' && (
            <div style={{ marginTop: '0.8rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', borderRadius: '4px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold' }}>
              🚨 Urgent SFE Required {urgentSfeNote && `- ${urgentSfeNote}`}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSLACard = (student, type) => {
    const personName = type === 'recruiter' ? student.recruiter : student.chaser;
    const historyField = type === 'recruiter' ? 'recruiterHistory' : 'chaserHistory';
    let lastNote = 'No notes available.';
    
    if (student[historyField] && student[historyField].length > 0) {
      const entriesWithNotes = student[historyField].filter(e => e.note && e.note.trim() !== '');
      if (entriesWithNotes.length > 0) {
        lastNote = entriesWithNotes[entriesWithNotes.length - 1].note;
      } else {
        lastNote = student[historyField][student[historyField].length - 1].note || 'Updated without note';
      }
    } else if (type === 'recruiter' && student.intStatusHistory && student.intStatusHistory.length > 0) {
      const entries = student.intStatusHistory.filter(e => e.note && e.note.trim() !== '');
      if (entries.length > 0) lastNote = entries[entries.length - 1].note;
    }

    return (
      <div key={student._id} style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>{student.name}</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {student.studentId}</div>
          </div>
          <span style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {type === 'recruiter' ? 'Recruiter SLA' : 'Chaser SLA'}
          </span>
        </div>
        
        <div style={{ background: 'var(--bg-color)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '0.3rem' }}>{type === 'recruiter' ? 'Recruiter' : 'Chaser'}: <span style={{color: '#3b82f6'}}>{personName || 'Unassigned'}</span></div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
            "{lastNote}"
          </div>
        </div>
      </div>
    );
  };

  const renderInterviewCard = (interview, colColor) => {
    return (
      <div key={interview._id} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${colColor}`, marginBottom: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{interview.studentName}</strong>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{interview.date ? new Date(interview.date).toLocaleDateString() : 'No Date'}</span>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ marginBottom: '4px' }}>🎓 {interview.college} {interview.subject ? `- ${interview.subject}` : ''}</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {interview.recruiter && <span style={{ background: '#8b5cf6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.65rem' }}>Recruiter: {interview.recruiter.split(' ')[0]}</span>}
          </div>
          {interview.comments && (
            <div style={{ marginTop: '0.8rem', padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '3px solid #f59e0b', borderRadius: '4px', fontSize: '0.75rem', color: '#f59e0b', fontStyle: 'italic', fontWeight: '500' }}>
              💬 {interview.comments}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPrepCard = (prep, colColor) => {
    return (
      <div key={prep.rowId + '-' + prep.colId} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${colColor}`, marginBottom: '0.8rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <strong style={{ color: 'var(--text-primary)' }}>{prep.text || 'Unnamed Student'}</strong>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {prep.employeeDoneBy && <div style={{ marginBottom: '4px' }}>👨‍💼 Done By: {prep.employeeDoneBy}</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Dashboard Overview</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
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

      {/* Admin Task Workflow Widget Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        {/* Admin Submission Workflow Widget */}
        <div 
          style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              👨‍💼 Admin Submissions
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click metrics to view ➔</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div onClick={() => setShowAdminWorkflowModal('docs')} style={{ background: 'rgba(107, 114, 128, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #6b7280', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b7280' }}>{colAwaitingAssignments.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Awaiting Assign</div>
            </div>
            <div onClick={() => setShowAdminWorkflowModal('sub')} style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{colSubmissionOngoing.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sub Ongoing</div>
            </div>
            <div onClick={() => setShowAdminWorkflowModal('urgent')} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{colUrgent.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Urgent</div>
            </div>
            <div onClick={() => setShowAdminWorkflowModal('completed')} style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{colCompleted.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completed</div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', height: '6px', background: 'var(--bg-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#10b981', width: `${students.length ? (colCompleted.length / students.length) * 100 : 0}%` }} />
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            {students.length ? Math.round((colCompleted.length / students.length) * 100) : 0}% completion rate
          </div>
        </div>

        {/* SFE Workflow Widget */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              💸 SFE Workflow
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click metrics to view ➔</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div onClick={() => setShowSfeWorkflowModal('awaiting')} style={{ background: 'rgba(107, 114, 128, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #6b7280', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b7280' }}>{colSfeAwaiting.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Awaiting SFE</div>
            </div>
            <div onClick={() => setShowSfeWorkflowModal('ongoing')} style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{colSfeOngoing.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SFE Ongoing</div>
            </div>
            <div onClick={() => setShowSfeWorkflowModal('urgent')} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{colSfeUrgent.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Urgent</div>
            </div>
            <div onClick={() => setShowSfeWorkflowModal('submitted')} style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{colSfeSubmitted.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SFE Submitted</div>
            </div>
          </div>
          
          <div onClick={() => setShowSfeWorkflowModal('approved')} style={{ marginTop: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
             <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{colSfeApproved.length}</div>
             <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SFE Approved</div>
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <div style={{ background: 'var(--bg-color)', borderRadius: '999px', height: '8px', width: '100%', overflow: 'hidden' }}>
              <div style={{ background: '#10b981', height: '100%', width: `${sfeCompletionRate}%`, transition: 'width 0.3s' }}></div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>{sfeCompletionRate}% completion rate</div>
          </div>
        </div>

        {/* Interviews Workflow Widget */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                🎤 Interview Tracking
              </h3>
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginLeft: '1rem' }}>Click metrics to view ➔</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div onClick={() => setShowIntWorkflowModal('pending')} style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>{colIntPending.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending</div>
            </div>
            <div onClick={() => setShowIntWorkflowModal('passed')} style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{colIntPassed.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Passed</div>
            </div>
            <div onClick={() => setShowIntWorkflowModal('failed')} style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{colIntFailed.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Failed</div>
            </div>
            <div onClick={() => setShowIntWorkflowModal('missed')} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{colIntMissed.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Missed</div>
            </div>
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            <div style={{ background: 'var(--bg-color)', borderRadius: '999px', height: '8px', width: '100%', overflow: 'hidden' }}>
              <div style={{ background: '#10b981', height: '100%', width: `${intCompletionRate}%`, transition: 'width 0.3s' }}></div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>{intCompletionRate}% pass rate</div>
          </div>
        </div>



        {/* Chaser Tasks Tracking Widget */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              🏃 Chaser Tasks (Today)
            </h3>
            <button onClick={() => setShowCreateChaserTaskModal(true)} style={{ fontSize: '0.75rem', background: '#3b82f6', color: '#fff', border: 'none', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>➕ Assign Task</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div onClick={() => setShowChaserTaskModal('pending')} style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{tasks.filter(t => t.taskType === 'Chaser' && t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) && t.status !== 'completed').length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending</div>
            </div>
            <div onClick={() => setShowChaserTaskModal('completed')} style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{tasks.filter(t => t.taskType === 'Chaser' && t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) && t.status === 'completed').length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completed</div>
            </div>
          </div>
          
          <div style={{ marginTop: '1rem' }}>
            {(() => {
              const chaserTotal = tasks.filter(t => t.taskType === 'Chaser' && t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' })).length;
              const chaserComp = tasks.filter(t => t.taskType === 'Chaser' && t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) && t.status === 'completed').length;
              const chaserRate = chaserTotal === 0 ? 0 : Math.round((chaserComp / chaserTotal) * 100);
              return (
                <>
                  <div style={{ background: 'var(--bg-color)', borderRadius: '999px', height: '8px', width: '100%', overflow: 'hidden' }}>
                    <div style={{ background: '#10b981', height: '100%', width: `${chaserRate}%`, transition: 'width 0.3s' }}></div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>{chaserRate}% completion rate (today)</div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Recruiter WL Tasks Tracking Widget */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              📝 WL Tasks (Today)
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click metrics to view ➔</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div onClick={() => setShowRecruiterTaskModal('pending')} style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>{tasks.filter(t => t.taskType !== 'Chaser' && t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) && t.status !== 'completed').length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pending</div>
            </div>
            <div onClick={() => setShowRecruiterTaskModal('completed')} style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{tasks.filter(t => t.taskType !== 'Chaser' && t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }) && t.status === 'completed').length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completed</div>
            </div>
          </div>
        </div>

        {/* SLA Alerts Widget */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
              ⚠️ SLA Alerts
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click metrics to view ➔</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
            <div onClick={() => setShowAlertsModal('recruiter')} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{colAlertRecruiter.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Recruiter &gt; 15 days inactive</div>
            </div>
            <div onClick={() => setShowAlertsModal('chaser')} style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.1s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{colAlertChaser.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Chaser &gt; 3 days inactive</div>
            </div>
          </div>
        </div>
      </div>

      {showAdminWorkflowModal && (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '1400px', width: '95%', maxHeight: '90vh', overflowY: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  👨‍💼 Admin Submission Workflow
                </h3>
                <select 
                  value={modalFilterMonth}
                  onChange={e => setModalFilterMonth(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}
                >
                  <option value="All">All Months</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select 
                  value={modalFilterWeek}
                  onChange={e => setModalFilterWeek(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}
                >
                  <option value="All">All Weeks</option>
                  <option value="Week 1">Week 1</option>
                  <option value="Week 2">Week 2</option>
                  <option value="Week 3">Week 3</option>
                  <option value="Week 4">Week 4</option>
                  <option value="Week 5">Week 5</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', width: '150px' }}
                />
              </div>
              <button onClick={() => setShowAdminWorkflowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            
            <div className="dms-modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {(() => {
                const dateExtractor = s => s.updatedAt || s.createdAt;
                const filteredDocs = applyModalFilter(colAwaitingAssignments, dateExtractor);
                const filteredSub = applyModalFilter(colSubmissionOngoing, dateExtractor);
                const filteredUrgent = applyModalFilter(colUrgent, dateExtractor);
                const filteredCompleted = applyModalFilter(colCompleted, dateExtractor);
                return (
                  <div>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                      Real-time tracking of application submissions. Click on a student card to assign tasks (CV, PS, QA, Sub) or change their status.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', overflowX: 'auto', minWidth: '300px' }}>
                      
                      {/* Column 1: Awaiting App Assignments */}
                      {showAdminWorkflowModal === 'docs' && (
                        <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: '#6b7280', borderBottom: '2px solid #6b7280', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Awaiting App Assignments</span>
                            <span style={{ background: '#6b7280', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredDocs.length}</span>
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {filteredDocs.map(s => renderStudentCard(s, '#6b7280'))}
                          </div>
                        </div>
                      )}

                      {/* Column 2: Submission Ongoing */}
                      {showAdminWorkflowModal === 'sub' && (
                        <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Submission Ongoing</span>
                            <span style={{ background: '#3b82f6', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredSub.length}</span>
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {filteredSub.map(s => renderStudentCard(s, '#3b82f6'))}
                          </div>
                        </div>
                      )}

                      {/* Column 3: Urgent Submission */}
                      {showAdminWorkflowModal === 'urgent' && (
                        <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: '#ef4444', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Urgent Submission</span>
                            <span style={{ background: '#ef4444', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredUrgent.length}</span>
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {filteredUrgent.map(s => renderStudentCard(s, '#ef4444'))}
                          </div>
                        </div>
                      )}

                      {/* Column 4: Completed */}
                      {showAdminWorkflowModal === 'completed' && (
                        <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Completed / Submitted</span>
                            <span style={{ background: '#10b981', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredCompleted.length}</span>
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {filteredCompleted.map(s => renderStudentCard(s, '#10b981'))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showSfeWorkflowModal && (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '1400px', width: '95%', maxHeight: '90vh', overflowY: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  💸 SFE Workflow
                </h3>
                <select 
                  value={modalFilterMonth}
                  onChange={e => setModalFilterMonth(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}
                >
                  <option value="All">All Months</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select 
                  value={modalFilterWeek}
                  onChange={e => setModalFilterWeek(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}
                >
                  <option value="All">All Weeks</option>
                  <option value="Week 1">Week 1</option>
                  <option value="Week 2">Week 2</option>
                  <option value="Week 3">Week 3</option>
                  <option value="Week 4">Week 4</option>
                  <option value="Week 5">Week 5</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', width: '150px' }}
                />
              </div>
              <button onClick={() => setShowSfeWorkflowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            <div className="dms-modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {(() => {
                const dateExtractor = s => s.updatedAt || s.createdAt;
                const filteredSfeAwaiting = applyModalFilter(colSfeAwaiting, dateExtractor);
                const filteredSfeOngoing = applyModalFilter(colSfeOngoing, dateExtractor);
                const filteredSfeUrgent = applyModalFilter(colSfeUrgent, dateExtractor);
                let filteredSfeSubmitted = applyModalFilter(colSfeSubmitted, dateExtractor);
                if (showOnlyUrgentSfeSubmitted) {
                  filteredSfeSubmitted = filteredSfeSubmitted.filter(s => s.sfeStatusHistory && s.sfeStatusHistory.some(h => h.status === 'Urgent SFE'));
                }
                const filteredSfeApproved = applyModalFilter(colSfeApproved, dateExtractor);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', overflowX: 'auto', minWidth: '300px' }}>
                    {showSfeWorkflowModal === 'awaiting' && (
                      <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#6b7280', borderBottom: '2px solid #6b7280', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Awaiting SFE</span>
                          <span style={{ background: '#6b7280', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredSfeAwaiting.length}</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {filteredSfeAwaiting.map(s => renderStudentCard(s, '#6b7280', (st) => setSfeAssignModal({ show: true, student: st }), 'sfe'))}
                        </div>
                      </div>
                    )}
                    {showSfeWorkflowModal === 'ongoing' && (
                      <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>SFE Ongoing</span>
                          <span style={{ background: '#3b82f6', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredSfeOngoing.length}</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {filteredSfeOngoing.map(s => renderStudentCard(s, '#3b82f6', (st) => setSfeAssignModal({ show: true, student: st }), 'sfe'))}
                        </div>
                      </div>
                    )}
                    {showSfeWorkflowModal === 'urgent' && (
                      <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#ef4444', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Urgent SFE</span>
                          <span style={{ background: '#ef4444', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredSfeUrgent.length}</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {filteredSfeUrgent.map(s => renderStudentCard(s, '#ef4444', (st) => setSfeAssignModal({ show: true, student: st }), 'sfe'))}
                        </div>
                      </div>
                    )}
                    {showSfeWorkflowModal === 'submitted' && (
                      <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>SFE Submitted</span>
                            <span style={{ background: '#f59e0b', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredSfeSubmitted.length}</span>
                          </h4>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showOnlyUrgentSfeSubmitted} onChange={(e) => setShowOnlyUrgentSfeSubmitted(e.target.checked)} />
                            Urgently Submitted Only
                          </label>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {filteredSfeSubmitted.map(s => renderStudentCard(s, '#f59e0b', (st) => setSfeAssignModal({ show: true, student: st }), 'sfe'))}
                        </div>
                      </div>
                    )}
                    {showSfeWorkflowModal === 'approved' && (
                      <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>SFE Approved</span>
                            <span style={{ background: '#10b981', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredSfeApproved.length}</span>
                          </h4>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {filteredSfeApproved.map(s => renderStudentCard(s, '#10b981', (st) => setSfeAssignModal({ show: true, student: st }), 'sfe'))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showIntWorkflowModal && (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '1400px', width: '95%', maxHeight: '90vh', overflowY: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎤 Interview Tracking
                </h3>
                <select 
                  value={modalFilterMonth}
                  onChange={e => setModalFilterMonth(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}
                >
                  <option value="All">All Months</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select 
                  value={modalFilterWeek}
                  onChange={e => setModalFilterWeek(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}
                >
                  <option value="All">All Weeks</option>
                  <option value="Week 1">Week 1</option>
                  <option value="Week 2">Week 2</option>
                  <option value="Week 3">Week 3</option>
                  <option value="Week 4">Week 4</option>
                  <option value="Week 5">Week 5</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', width: '150px' }}
                />
              </div>
              <button onClick={() => setShowIntWorkflowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            <div className="dms-modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {(() => {
                const dateExtractor = i => i.date;
                const filteredIntPending = applyModalFilter(colIntPending, dateExtractor);
                const filteredIntPassed = applyModalFilter(colIntPassed, dateExtractor);
                const filteredIntFailed = applyModalFilter(colIntFailed, dateExtractor);
                const filteredIntMissed = applyModalFilter(colIntMissed, dateExtractor);
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', overflowX: 'auto', minWidth: '300px' }}>
                    {showIntWorkflowModal === 'pending' && (
                      <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#3b82f6', borderBottom: '2px solid #3b82f6', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Pending Interviews</span>
                          <span style={{ background: '#3b82f6', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredIntPending.length}</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {filteredIntPending.map(s => renderInterviewCard(s, '#3b82f6'))}
                        </div>
                      </div>
                    )}
                    {showIntWorkflowModal === 'passed' && (
                      <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Passed Interviews</span>
                          <span style={{ background: '#10b981', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredIntPassed.length}</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {filteredIntPassed.map(s => renderInterviewCard(s, '#10b981'))}
                        </div>
                      </div>
                    )}
                    {showIntWorkflowModal === 'failed' && (
                      <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b', borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Failed Interviews</span>
                          <span style={{ background: '#f59e0b', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredIntFailed.length}</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {filteredIntFailed.map(s => renderInterviewCard(s, '#f59e0b'))}
                        </div>
                      </div>
                    )}
                    {showIntWorkflowModal === 'missed' && (
                      <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ margin: '0 0 1rem 0', color: '#ef4444', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Missed Interviews</span>
                          <span style={{ background: '#ef4444', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{filteredIntMissed.length}</span>
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                          {filteredIntMissed.map(s => renderInterviewCard(s, '#ef4444'))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showAlertsModal && (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '1400px', width: '95%', maxHeight: '90vh', overflowY: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  ⚠️ SLA Alerts
                </h3>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', width: '150px' }}
                />
              </div>
              <button onClick={() => setShowAlertsModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            <div className="dms-modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', overflowX: 'auto', minWidth: '300px' }}>
                {showAlertsModal === 'recruiter' && (
                  <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#ef4444', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Recruiter SLA Breach (&gt; 15 days)</span>
                      <span style={{ background: '#ef4444', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{colAlertRecruiter.length}</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {applyModalFilter(colAlertRecruiter, () => null).map(s => renderSLACard(s, 'recruiter'))}
                    </div>
                  </div>
                )}
                {showAlertsModal === 'chaser' && (
                  <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#ef4444', borderBottom: '2px solid #ef4444', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Chaser SLA Breach (&gt; 3 days)</span>
                      <span style={{ background: '#ef4444', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{colAlertChaser.length}</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                      {applyModalFilter(colAlertChaser, () => null).map(s => renderSLACard(s, 'chaser'))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrepModal && (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '1400px', width: '95%', maxHeight: '90vh', overflowY: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎯 Prep Tracking
                </h3>
                <select 
                  value={modalFilterMonth}
                  onChange={e => setModalFilterMonth(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}
                >
                  <option value="All">All Months</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <select 
                  value={modalFilterWeek}
                  onChange={e => setModalFilterWeek(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}
                >
                  <option value="All">All Weeks</option>
                  <option value="Week 1">Week 1</option>
                  <option value="Week 2">Week 2</option>
                  <option value="Week 3">Week 3</option>
                  <option value="Week 4">Week 4</option>
                  <option value="Week 5">Week 5</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', width: '150px' }}
                />
              </div>
              <button onClick={() => setShowPrepModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            <div className="dms-modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {(() => {
                const dateExtractor = p => {
                  if (!p.keyStr) return null;
                  const parts = p.keyStr.split('-');
                  if (parts.length < 3) return null;
                  return `${parts[0]}-${parts[1]}-${parts[2]}`;
                };
                const filteredPrepsDone = applyModalFilter(prepsDone, dateExtractor);
                const filteredPrepsMissed = applyModalFilter(prepsMissed, dateExtractor);
                const filteredPrepsRescheduled = applyModalFilter(prepsRescheduled, dateExtractor);
                const currentList = showPrepModal === 'done' ? filteredPrepsDone : showPrepModal === 'missed' ? filteredPrepsMissed : filteredPrepsRescheduled;
                const modalTitleColor = showPrepModal === 'done' ? '#10b981' : showPrepModal === 'missed' ? '#ef4444' : '#3b82f6';
                const modalTitleText = showPrepModal === 'done' ? 'Preps Done' : showPrepModal === 'missed' ? 'Preps Missed' : 'Preps Rescheduled';
                
                const filteredAnalytics = { bookedBy: {}, doneBy: {} };
                currentList.forEach(p => {
                  if (!p.text || p.text.trim() === '') return;
                  const parts = p.text.split('-');
                  const employeeName = parts.length > 0 ? parts[parts.length - 1].trim() : 'Unknown';
                  if (!filteredAnalytics.bookedBy[employeeName]) filteredAnalytics.bookedBy[employeeName] = [];
                  filteredAnalytics.bookedBy[employeeName].push(p);

                  const doneByName = p.employeeDoneBy || 'Unknown';
                  if (!filteredAnalytics.doneBy[doneByName]) filteredAnalytics.doneBy[doneByName] = [];
                  filteredAnalytics.doneBy[doneByName].push(p);
                });

                const sortedBooked = Object.entries(filteredAnalytics.bookedBy).sort((a, b) => b[1].length - a[1].length);
                const sortedDone = Object.entries(filteredAnalytics.doneBy).sort((a, b) => b[1].length - a[1].length);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', border: `1px solid var(--border-color)` }}>
                      <h4 style={{ margin: '0 0 1rem 0', color: modalTitleColor, borderBottom: `2px solid ${modalTitleColor}`, paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{modalTitleText} Breakdown</span>
                        <span style={{ background: modalTitleColor, color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{currentList.length}</span>
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                          <h5 style={{ margin: '0 0 0.5rem 0', color: '#8b5cf6', fontSize: '0.85rem' }}>Who Booked These Preps?</h5>
                          <div style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                            {sortedBooked.length > 0 ? sortedBooked.map(([name, preps]) => (
                              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.3rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-primary)' }}>{name}</span>
                                <strong style={{ color: '#8b5cf6' }}>{preps.length}</strong>
                              </div>
                            )) : <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No bookings found</div>}
                          </div>
                        </div>
                        
                        <div>
                          <h5 style={{ margin: '0 0 0.5rem 0', color: modalTitleColor, fontSize: '0.85rem' }}>Who Acted On These Preps?</h5>
                          <div style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                            {sortedDone.length > 0 ? sortedDone.map(([name, preps]) => (
                              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '0.3rem 0', borderBottom: '1px solid var(--border-color)' }}>
                                <span style={{ color: 'var(--text-primary)' }}>{name}</span>
                                <strong style={{ color: modalTitleColor }}>{preps.length}</strong>
                              </div>
                            )) : <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No actions found</div>}
                          </div>
                        </div>
                      </div>
                      
                      <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '0.9rem' }}>Detailed List</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {currentList.map(p => renderPrepCard(p, modalTitleColor))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {sfeAssignModal.show && (
        <div className="dms-modal-overlay" style={{ zIndex: 3000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '500px', width: '90%', padding: '2rem', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Assign SFE Officer</h3>
              <button onClick={() => setSfeAssignModal({ show: false, student: null })} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Assign SFE task for <strong style={{ color: 'var(--text-primary)' }}>{sfeAssignModal.student?.name}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>💸 SFE Officer</label>
                {['SFE Approved - Awaiting enrollment', 'Enrollment Done', 'SFE Approved - Deferred', 'SFE approved'].includes(sfeAssignModal.student?.sfeStatus) ? (
                  <span style={{ padding: '0.5rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                    {(sfeAssignModal.student?.chasers && sfeAssignModal.student.chasers.sfe) || 'Unassigned'} (Read-Only)
                  </span>
                ) : (
                  <select 
                    value={(sfeAssignModal.student?.chasers && sfeAssignModal.student.chasers.sfe) || ''}
                    onChange={(e) => handleSfeAssignDropdown(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', width: '200px' }}
                  >
                    <option value="">Unassigned</option>
                    {allUsers.filter(u => ['dina', 'saad', 'apsara'].includes(u.name.toLowerCase())).map(u => (
                      <option key={u._id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {(sfeAssignModal.student?.chasers && sfeAssignModal.student.chasers.sfe) && (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                {(colSfeOngoing.some(s => s._id === sfeAssignModal.student?._id) || colSfeUrgent.some(s => s._id === sfeAssignModal.student?._id)) ? (
                  <button 
                    onClick={() => handleSfeStatusAction('SFE submitted', 'Are you sure you want to mark this SFE task as Submitted?')}
                    style={{ flex: 1, background: '#f59e0b', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Mark as Submitted
                  </button>
                ) : null}
                {colSfeSubmitted.some(s => s._id === sfeAssignModal.student?._id) ? (
                  <button 
                    onClick={() => handleSfeStatusAction('SFE approved', 'Are you sure you want to mark this SFE as Approved?')}
                    style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Mark as Approved
                  </button>
                ) : null}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSfeAssignModal({ show: false, student: null })} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
            </div>
          </div>
        </div>
      )}

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
                <select 
                  value={analyticsWeek} 
                  onChange={e => setAnalyticsWeek(e.target.value)}
                  style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.4rem', borderRadius: '6px' }}
                >
                  <option value="All">All Weeks</option>
                  {[1,2,3,4,5].map(w => <option key={w} value={w}>Week {w}</option>)}
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
          if (modalSearchTerm) {
            const term = modalSearchTerm.toLowerCase();
            const matchesSearch = (s.name && s.name.toLowerCase().includes(term)) || (s.studentId && s.studentId.toLowerCase().includes(term));
            if (!matchesSearch) return false;
          }
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
                  🎯 Admin Task Distribution
                </h3>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
                    <option value="Today">Today</option>
                    <option value="This Week">This Week</option>
                  </select>

                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={modalSearchTerm}
                    onChange={(e) => setModalSearchTerm(e.target.value)}
                    style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', borderRadius: '6px', width: '150px' }}
                  />

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
                { type: 'qa', label: '✅ QA Maker' },
                { type: 'sub', label: '📤 Submission & QC Checker' }
              ].map(({ type, label }) => (
                <div key={type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <label style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{label}</label>
                  <select 
                    value={(assignModal.student.chasers && assignModal.student.chasers[type]) || ''}
                    onChange={(e) => handleDashboardChaserChange(type, e.target.value)}
                    disabled={assignModal.student.appStatus === 'Submitted'}
                    style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)', width: '200px', opacity: assignModal.student.appStatus === 'Submitted' ? 0.6 : 1 }}
                  >
                    <option value="">Unassigned</option>
                    {allUsers.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {assignModal.student.appStatus !== 'Submitted' && (
              <div style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>Change Application Status</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {['Assign for submission', 'Submission ongoing', 'Urgent Submission', 'Submitted'].map(status => (
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
                      {status === 'Submitted' ? 'Completed / Submitted' : status}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignModal({ show: false, student: null })} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {showRecruiterTaskModal && (() => {
        let filteredTasks = tasks;
        if (recruiterTaskFilter === 'Today') {
          filteredTasks = tasks.filter(t => t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }));
        } else if (recruiterTaskFilter !== 'All') {
          filteredTasks = tasks.filter(t => t.day === recruiterTaskFilter);
        }
        if (modalSearchTerm) {
          const term = modalSearchTerm.toLowerCase();
          filteredTasks = filteredTasks.filter(t => (t.assignedTo && t.assignedTo.toLowerCase().includes(term)) || (t.leadNum && t.leadNum.toLowerCase().includes(term)));
        }
        
        const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
        const completedTasks = filteredTasks.filter(t => t.status === 'completed');
        
        return (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📝 Weekly WL Task Report
                </h3>
                <select 
                  value={recruiterTaskFilter}
                  onChange={e => setRecruiterTaskFilter(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}
                >
                  <option value="Today">Today Only</option>
                  <option value="All">All Week</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', width: '150px' }}
                />
              </div>
              <button onClick={() => setShowRecruiterTaskModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            <div className="dms-modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', overflowX: 'auto', minWidth: '300px' }}>
                {showRecruiterTaskModal === 'pending' && (
                  <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b', borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pending Tasks</span>
                      <span style={{ background: '#f59e0b', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{pendingTasks.length}</span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {pendingTasks.map(t => (
                        <div key={t._id} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{t.assignedTo}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lead: {t.leadNum} | Day: {t.day} | Shift: {t.shift}</div>
                          </div>
                          <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{t.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {showRecruiterTaskModal === 'completed' && (
                  <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Completed Tasks</span>
                      <span style={{ background: '#10b981', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{completedTasks.length}</span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {completedTasks.map(t => (
                        <div key={t._id} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{t.assignedTo}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lead: {t.leadNum} | Day: {t.day} | Shift: {t.shift}</div>
                          </div>
                          <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Completed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );})()}

      {/* CREATE CHASER TASK MODAL */}
      {showCreateChaserTaskModal && (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: '12px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>➕ Assign Chaser Task</h3>
              <button onClick={() => setShowCreateChaserTaskModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            <form onSubmit={handleCreateChaserTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Assign To (Chaser)</label>
                <select required value={newChaserTask.assignedTo} onChange={e => setNewChaserTask({ ...newChaserTask, assignedTo: e.target.value })} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                  <option value="">Select Chaser...</option>
                  {allUsers.filter(u => u.jobTitles?.includes('Chaser') || u.role === 'chaser').map(u => (
                    <option key={u._id} value={u.name}>{u.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Lead Num / Reference</label>
                <input required value={newChaserTask.leadNum} onChange={e => setNewChaserTask({ ...newChaserTask, leadNum: e.target.value })} placeholder="e.g. Lead 12345" style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Notes / Instructions</label>
                <textarea required value={newChaserTask.notes} onChange={e => setNewChaserTask({ ...newChaserTask, notes: e.target.value })} rows="3" placeholder="Add specific task notes..." style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', resize: 'vertical' }}></textarea>
              </div>
              <button type="submit" style={{ padding: '0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>Assign Task</button>
            </form>
          </div>
        </div>
      )}

      {/* CHASER TASK REPORT MODAL */}
      {showChaserTaskModal && (() => {
        let filteredTasks = tasks.filter(t => t.taskType === 'Chaser');
        if (chaserTaskFilter === 'Today') {
          filteredTasks = filteredTasks.filter(t => t.day === new Date().toLocaleDateString('en-US', { weekday: 'long' }));
        } else if (chaserTaskFilter !== 'All') {
          filteredTasks = filteredTasks.filter(t => t.day === chaserTaskFilter);
        }
        if (modalSearchTerm) {
          const term = modalSearchTerm.toLowerCase();
          filteredTasks = filteredTasks.filter(t => (t.assignedTo && t.assignedTo.toLowerCase().includes(term)) || (t.leadNum && t.leadNum.toLowerCase().includes(term)));
        }
        
        const pendingTasks = filteredTasks.filter(t => t.status !== 'completed');
        const completedTasks = filteredTasks.filter(t => t.status === 'completed');
        
        return (
        <div className="dms-modal-overlay" style={{ zIndex: 2000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="dms-modal" style={{ background: 'var(--bg-surface)', maxWidth: '1000px', width: '95%', maxHeight: '90vh', overflowY: 'hidden', display: 'flex', flexDirection: 'column', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🏃 Chaser Task Report
                </h3>
                <select 
                  value={chaserTaskFilter}
                  onChange={e => setChaserTaskFilter(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}
                >
                  <option value="Today">Today Only</option>
                  <option value="All">All Week</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', width: '150px' }}
                />
              </div>
              <button onClick={() => setShowChaserTaskModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✗</button>
            </div>
            <div className="dms-modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', overflowX: 'auto', minWidth: '300px' }}>
                {showChaserTaskModal === 'pending' && (
                  <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b', borderBottom: '2px solid #f59e0b', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Pending Tasks</span>
                      <span style={{ background: '#f59e0b', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{pendingTasks.length}</span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {pendingTasks.map(t => (
                        <div key={t._id} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{t.assignedTo}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lead: {t.leadNum} | Day: {t.day}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.4rem', background: 'var(--bg-color)', padding: '0.5rem', borderRadius: '4px', fontStyle: 'italic' }}>{t.notes}</div>
                          </div>
                          <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{t.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {showChaserTaskModal === 'completed' && (
                  <div style={{ background: 'var(--bg-color)', borderRadius: '8px', padding: '1rem', minHeight: '300px', border: '1px solid var(--border-color)' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#10b981', borderBottom: '2px solid #10b981', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Completed Tasks</span>
                      <span style={{ background: '#10b981', color: '#fff', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem' }}>{completedTasks.length}</span>
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {completedTasks.map(t => (
                        <div key={t._id} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{t.assignedTo}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lead: {t.leadNum} | Day: {t.day}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.4rem', background: 'var(--bg-color)', padding: '0.5rem', borderRadius: '4px', fontStyle: 'italic' }}>{t.notes}</div>
                          </div>
                          <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Completed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );})()}
    </div>
  );
};

export default Dashboard;
