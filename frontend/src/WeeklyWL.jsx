import React, { useState, useEffect } from 'react';
import './WeeklyWL.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const EditableInput = ({ initialValue, onSave, disabled }) => {
  const [val, setVal] = useState(initialValue || '');
  useEffect(() => { setVal(initialValue || ''); }, [initialValue]);
  return (
    <input 
      type="text" 
      disabled={disabled}
      value={val} 
      onChange={e => setVal(e.target.value)} 
      onBlur={() => { if(val !== initialValue) onSave(val); }} 
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
      style={{ width: '100%', padding: '0.4rem', border: '1px solid transparent', background: 'transparent', color: 'var(--text-primary)' }}
      className="editable-cell-input"
    />
  );
};

const WeeklyWL = ({ currentUserRole, currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [wlRecruiters, setWlRecruiters] = useState([]);
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(days.includes(todayName) ? todayName : 'Monday');
  
  const [randomLeadsInput, setRandomLeadsInput] = useState('');

  const isAdmin = ['super_admin', 'admin', 'admins for task assigns', 'team leader', 'asst. team leader'].includes(currentUserRole);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tasks`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      const data = await res.json();
      setUsers(data);
      // Only Recruiters and Chasers will appear on the WL board
      setWlRecruiters(data.filter(u => u.role === 'recruiter' || u.role === 'chaser'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRecruiterTask = async (recruiterName, field, value) => {
    if (!isAdmin && currentUser !== recruiterName) return;
    if (!isAdmin && field !== 'status') return; // Non-admins can only update their own status
    
    // Find existing task for this recruiter on selectedDay
    const existingTask = tasks.find(t => t.day === selectedDay && t.assignedTo === recruiterName);
    
    if (existingTask) {
       try {
         const res = await fetch(`${API_BASE}/api/tasks/${existingTask._id}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ [field]: value })
         });
         const data = await res.json();
         if (data.success) setTasks(tasks.map(t => t._id === existingTask._id ? data.task : t));
       } catch (e) { console.error(e); }
    } else {
       if (!isAdmin) return; // Only admins can implicitly create tasks
       try {
         const res = await fetch(`${API_BASE}/api/tasks`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             day: selectedDay,
             shift: '6 Hours', // Implicit single shift
             leadNum: field === 'leadNum' ? value : '',
             assignedTo: recruiterName,
             assignedBy: currentUser,
             status: field === 'status' ? value : 'pending',
             taskType: 'Call',
             startDateAndTime: field === 'startDateAndTime' ? value : '',
             endTime: field === 'endTime' ? value : ''
           })
         });
         const data = await res.json();
         if (data.success) setTasks([data.task, ...tasks]);
       } catch (e) { console.error(e); }
    }
  };

  const handleRandomDistribute = async () => {
     if(!isAdmin) return;
     if(!randomLeadsInput.trim()) return alert("Enter some leads to distribute. Separate groups with semicolons (;).");
     
     // Find recruiters who are NOT on Leave today
     const activeRecruiters = wlRecruiters.filter(r => {
        const t = tasks.find(tsk => tsk.day === selectedDay && tsk.assignedTo === r.name);
        return !t || t.status !== 'Leave';
     });
     
     if(activeRecruiters.length === 0) return alert("No active recruiters found for today.");
     
     const chunks = randomLeadsInput.split(';').map(s => s.trim()).filter(s => s);
     
     for(const chunk of chunks) {
         const randomR = activeRecruiters[Math.floor(Math.random() * activeRecruiters.length)].name;
         const t = tasks.find(tsk => tsk.day === selectedDay && tsk.assignedTo === randomR);
         
         if(t) {
             const newLead = t.leadNum ? `${t.leadNum}, ${chunk}` : chunk;
             await fetch(`${API_BASE}/api/tasks/${t._id}`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ leadNum: newLead })
             });
         } else {
             await fetch(`${API_BASE}/api/tasks`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({
                 day: selectedDay,
                 shift: '6 Hours',
                 leadNum: chunk,
                 assignedTo: randomR,
                 assignedBy: currentUser,
                 status: 'pending',
                 taskType: 'Call',
                 startDateAndTime: '',
                 endTime: ''
               })
             });
         }
     }
     setRandomLeadsInput('');
     fetchTasks(); // Refresh tasks after bulk random distribution
  };

  return (
    <div className="wl-container">
      <div className="wl-header" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Weekly Work List (WL)</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Viewing Day:</span>
            <select 
              value={selectedDay} 
              onChange={e => setSelectedDay(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {isAdmin && (
          <div style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem' }}>🎲</span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', marginBottom: '0.2rem' }}>Random Lead Distributor</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Separate lead groups with semicolons. (e.g. <code>pg-1,10; pg-11,20; lsc-1,5</code>)</span>
            </div>
            <input 
              type="text" 
              placeholder="e.g. pg-1,10; pg-11,20" 
              value={randomLeadsInput} 
              onChange={e => setRandomLeadsInput(e.target.value)}
              style={{ flex: 2, padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
            />
            <button onClick={handleRandomDistribute} className="random-btn">Distribute Randomly</button>
          </div>
        )}
      </div>

      <div className="wl-table-container">
        <table className="wl-table">
          <thead>
            <tr>
              <th style={{ width: '200px' }}>Recruiter</th>
              <th>Assigned Leads</th>
              <th style={{ width: '150px' }}>Status</th>
              <th style={{ width: '200px' }}>Start Time</th>
              <th style={{ width: '200px' }}>End Time</th>
            </tr>
          </thead>
          <tbody>
            {wlRecruiters.map(recruiter => {
              const task = tasks.find(t => t.day === selectedDay && t.assignedTo === recruiter.name) || {};
              const isLeave = task.status === 'Leave';
              
              return (
                <tr key={recruiter._id} style={{ opacity: isLeave ? 0.6 : 1, background: isLeave ? 'var(--bg-surface-hover)' : 'transparent' }}>
                  <td style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLeave ? '#ef4444' : '#10b981' }}></div>
                    {recruiter.name}
                  </td>
                  <td>
                    <EditableInput 
                      disabled={!isAdmin}
                      initialValue={task.leadNum} 
                      onSave={val => handleUpdateRecruiterTask(recruiter.name, 'leadNum', val)} 
                    />
                  </td>
                  <td>
                    <select 
                      disabled={!isAdmin && currentUser !== recruiter.name}
                      className={`status-badge ${task.status || 'pending'}`} 
                      value={task.status || 'pending'} 
                      onChange={e => handleUpdateRecruiterTask(recruiter.name, 'status', e.target.value)}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid transparent' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="working">Working</option>
                      <option value="completed">Completed</option>
                      <option value="Leave">Leave</option>
                    </select>
                  </td>
                  <td>
                    <EditableInput 
                      disabled={!isAdmin}
                      initialValue={task.startDateAndTime} 
                      onSave={val => handleUpdateRecruiterTask(recruiter.name, 'startDateAndTime', val)} 
                    />
                  </td>
                  <td>
                    <EditableInput 
                      disabled={!isAdmin}
                      initialValue={task.endTime} 
                      onSave={val => handleUpdateRecruiterTask(recruiter.name, 'endTime', val)} 
                    />
                  </td>
                </tr>
              );
            })}
            {wlRecruiters.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No recruiters found in the system.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyWL;
