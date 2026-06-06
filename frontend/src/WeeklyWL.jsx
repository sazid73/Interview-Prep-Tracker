import SearchableSelect from './SearchableSelect';
import React, { useState, useEffect } from 'react';
import './WeeklyWL.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const EditableInput = ({ initialValue, onSave, disabled, placeholder }) => {
  const [val, setVal] = useState(initialValue || '');
  useEffect(() => { setVal(initialValue || ''); }, [initialValue]);
  return (
    <input 
      type="text" 
      disabled={disabled}
      placeholder={placeholder}
      value={val} 
      onChange={e => setVal(e.target.value)} 
      onBlur={() => { if(val !== initialValue) onSave(val); }} 
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
      style={{ width: '100%', padding: '0.4rem', border: '1px solid transparent', background: 'transparent', color: 'var(--text-primary)' }}
      className="editable-cell-input"
    />
  );
};

const WeeklyWL = ({ currentUserRole, currentUser, currentUserData }) => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [wlRecruiters, setWlRecruiters] = useState([]);
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const [selectedDay, setSelectedDay] = useState(days.includes(todayName) ? todayName : 'Monday');
  
  // Advanced Random Distributor State
  const [distPrefix, setDistPrefix] = useState('');
  const [distStart, setDistStart] = useState('');
  const [distEnd, setDistEnd] = useState('');
  const [distSize, setDistSize] = useState('5');
  
  const [showLeave, setShowLeave] = useState(false);

  const isAdmin = currentUserData?.abilities?.includes('super_admin') 
               || currentUserData?.abilities?.includes('assign_tasks') 
               || ['team leader', 'asst. team leader'].includes(currentUserRole);

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

  const defaultWlNames = ['Sazid', 'Ahasan', 'Alee', 'Arnika', 'Aryan', 'Diya', 'Evan', 'Isha', 'Mohaimen', 'Tunajjinah', 'Tunajjina', 'Arusa'];

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`);
      const data = await res.json();
      setUsers(data);
      setWlRecruiters(data.filter(u => u.isWlBoard || defaultWlNames.includes(u.name)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearLeads = async () => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to clear ALL assigned leads for ${selectedDay}?`)) return;
    
    const tasksToClear = tasks.filter(t => t.day === selectedDay && t.leadNum);
    
    // Instantly clear locally
    setTasks(prev => prev.map(t => {
      if (t.day === selectedDay && t.leadNum) return { ...t, leadNum: '' };
      return t;
    }));

    // Save to DB in parallel
    await Promise.all(tasksToClear.map(t => 
      fetch(`${API_BASE}/api/tasks/${t._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadNum: '' })
      })
    ));
    
    fetchTasks();
    alert(`Cleared leads for ${tasksToClear.length} tasks.`);
  };

  const handleRemoveRecruiter = async (recruiterName) => {
    if (!isAdmin) return;
    if (!window.confirm(`Remove ${recruiterName} from the board?`)) return;
    
    setWlRecruiters(prev => prev.filter(r => r.name !== recruiterName));
    
    try {
      await fetch(`${API_BASE}/api/users/${recruiterName}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isWlBoard: false })
      });
    } catch (e) { console.error(e); }
  };

  const handleUpdateRecruiterTask = async (recruiterName, shift, field, value) => {
    if (!isAdmin && currentUser !== recruiterName) return;
    if (!isAdmin && field !== 'status') return;
    
    // Find existing task for this recruiter on selectedDay for the specified shift
    const existingTask = tasks.find(t => t.day === selectedDay && t.shift === shift && t.assignedTo === recruiterName);
    
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
       if (!isAdmin && field !== 'status') return; 
       try {
         const res = await fetch(`${API_BASE}/api/tasks`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             day: selectedDay,
             shift: shift,
             leadNum: field === 'leadNum' ? value : '',
             assignedTo: recruiterName,
             assignedBy: currentUser,
             status: field === 'status' ? value : 'working', // default to working
             taskType: 'Call',
             startDateAndTime: field === 'startDateAndTime' ? value : '',
             endTime: field === 'endTime' ? value : ''
           })
         });
         const data = await res.json();
         if (data.success) setTasks([...tasks, data.task]);
       } catch (e) { console.error(e); }
    }
  };

  // Changing status updates BOTH Day and Evening tasks to keep them in sync for "Leave", "Break", "Working"
  const handleUpdateStatus = async (recruiterName, value) => {
      await handleUpdateRecruiterTask(recruiterName, 'DAY TIME', 'status', value);
      await handleUpdateRecruiterTask(recruiterName, 'EVENING TIME', 'status', value);
      // For instant UI update before fetch completes:
      setTasks(prev => prev.map(t => 
         (t.day === selectedDay && t.assignedTo === recruiterName) ? { ...t, status: value } : t
      ));
  };

  useEffect(() => {
    const handleProfileUpdate = (e) => {
      fetchUsers();
      if (e.detail && e.detail.field === 'presence' && e.detail.currentUser) {
        handleUpdateStatus(e.detail.currentUser, e.detail.value);
      }
    };
    window.addEventListener('user-profile-updated', handleProfileUpdate);
    return () => window.removeEventListener('user-profile-updated', handleProfileUpdate);
  }, [tasks, selectedDay]);

  const handleAdvancedDistribute = async () => {
     if(!isAdmin) return;
     const start = parseInt(distStart, 10);
     const end = parseInt(distEnd, 10);
     const size = parseInt(distSize, 10);
     
     if(isNaN(start) || isNaN(end) || isNaN(size) || size < 1) {
       return alert("Please enter valid numbers for Start, End, and Size.");
     }
     if(start > end) return alert("Start number cannot be greater than End number.");

     // Generate Chunks
     const chunks = [];
     for(let i = start; i <= end; i += size) {
        let chunkEnd = Math.min(i + size - 1, end);
        chunks.push(`${distPrefix}${i}-${chunkEnd}`);
     }
     
     // Find recruiters who are NOT on Leave or Prep globally or via task
     const activeRecruiters = wlRecruiters.filter(r => {
        if (r.presence === 'leave' || r.presence === 'prep') return false;
        const t = tasks.find(tsk => tsk.day === selectedDay && tsk.assignedTo === r.name && tsk.shift === 'DAY TIME');
        return !t || (t.status !== 'Leave' && t.status !== 'prep');
     });
     
     if(activeRecruiters.length === 0) return alert("No active recruiters found for today.");
     
     // Shuffle recruiters for fair assignment
     const shuffledRecruiters = [...activeRecruiters].sort(() => 0.5 - Math.random());
     
     // Day gets a full shuffled copy of the chunks
     const dayChunks = [...chunks].sort(() => 0.5 - Math.random());
     
     // Evening gets a different shuffled copy of the chunks
     // To absolutely guarantee they don't get the same chunk they got in the day, we offset the assignment
     const eveningChunks = [...dayChunks]; 
     eveningChunks.push(eveningChunks.shift()); // Shift by 1 ensures no overlap if evenly distributed
     
     const processAssignment = async (chunkList, shift) => {
         for(let i = 0; i < chunkList.length; i++) {
             const chunk = chunkList[i];
             const recruiter = shuffledRecruiters[i % shuffledRecruiters.length];
             
             const t = tasks.find(tsk => tsk.day === selectedDay && tsk.shift === shift && tsk.assignedTo === recruiter.name);
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
                     shift: shift,
                     leadNum: chunk,
                     assignedTo: recruiter.name,
                     assignedBy: currentUser,
                     status: 'working',
                     taskType: 'Call',
                     startDateAndTime: '',
                     endTime: ''
                   })
                 });
             }
         }
     };

     await processAssignment(dayChunks, 'DAY TIME');
     await processAssignment(eveningChunks, 'EVENING TIME');
     
     setDistPrefix('');
     setDistStart('');
     setDistEnd('');
     fetchTasks(); 
     alert(`Successfully distributed all chunks to Day and Evening across ${shuffledRecruiters.length} active recruiters!`);
  };

  return (
    <div className="wl-container">
      <div className="wl-header" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Weekly Work List (WL)</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Viewing Day:</span>
            <SearchableSelect 
              value={selectedDay} 
              onChange={e => setSelectedDay(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontSize: '1.1rem', fontWeight: 'bold' }}
            >
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </SearchableSelect>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <SearchableSelect onChange={async (e) => {
                 if (e.target.value) {
                   const userName = e.target.value;
                   const u = users.find(user => user.name === userName);
                   if (u && !wlRecruiters.find(r => r.name === u.name)) {
                     setWlRecruiters([...wlRecruiters, u]);
                     try {
                       await fetch(`${API_BASE}/api/users/${userName}/profile`, {
                         method: 'PUT',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ isWlBoard: true })
                       });
                     } catch(err) { console.error(err); }
                   }
                   e.target.value = '';
                 }
              }} style={{ padding: '0.6rem', borderRadius: '8px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                <option value="">+ Add Recruiter to Board</option>
                {users.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
              </SearchableSelect>
            </div>
            <button 
              onClick={() => setShowLeave(!showLeave)}
              style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: showLeave ? '#ef4444' : 'var(--bg-surface-hover)', color: showLeave ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
            >
              {showLeave ? 'Hide Leave' : 'Show Leave'}
            </button>
          </div>
        </div>

        {isAdmin && (
          <div style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>🎲</span>
              <strong style={{ display: 'block' }}>Advanced Range Distributor</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Automatically cuts ranges (e.g. 1 to 55) into smaller chunks and distributes to Day/Evening columns.</span>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prefix (Optional)</label>
                <input type="text" placeholder="e.g. pg-" value={distPrefix} onChange={e => setDistPrefix(e.target.value)} style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Start Number *</label>
                <input type="number" placeholder="1" value={distStart} onChange={e => setDistStart(e.target.value)} style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>End Number *</label>
                <input type="number" placeholder="55" value={distEnd} onChange={e => setDistEnd(e.target.value)} style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', flex: 1 }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pages Per Chunk</label>
                <input type="number" placeholder="5" value={distSize} onChange={e => setDistSize(e.target.value)} style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                <button onClick={handleAdvancedDistribute} className="random-btn" style={{ padding: '0.6rem 2rem' }}>Distribute</button>
                <button onClick={handleClearLeads} style={{ padding: '0.6rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Clear Leads</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="wl-table-container">
        <table className="wl-table" style={{ minWidth: '900px' }}>
          <thead>
            <tr>
              <th style={{ width: '180px' }}>Recruiter</th>
              <th style={{ width: '130px' }}>Attendance</th>
              <th style={{ background: '#3b82f6' }}>Day Leads</th>
              <th style={{ background: '#8b5cf6' }}>Evening Leads</th>
              <th style={{ width: '150px' }}>Start Time</th>
              <th style={{ width: '150px' }}>End Time</th>
            </tr>
          </thead>
          <tbody>
            {wlRecruiters.map(recruiter => {
              const dayTask = tasks.find(t => t.day === selectedDay && t.shift === 'DAY TIME' && t.assignedTo === recruiter.name) || {};
              const eveningTask = tasks.find(t => t.day === selectedDay && t.shift === 'EVENING TIME' && t.assignedTo === recruiter.name) || {};
              
              // Attendance is determined by the Day Task primarily or global presence
              let status = dayTask.status || eveningTask.status || 'working';
              // If global presence is leave, it overrides WL display logic
              if (recruiter.presence === 'leave' || status === 'Leave') {
                  status = 'Leave';
              }
              const isLeave = status === 'Leave';
              
              if (isLeave && !showLeave) return null; // Hide if on leave and toggle is off
              
              return (
                <tr key={recruiter._id} style={{ opacity: isLeave ? 0.6 : 1, background: isLeave ? 'var(--bg-surface-hover)' : 'transparent' }}>
                  <td style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isAdmin && (
                      <button 
                        onClick={() => handleRemoveRecruiter(recruiter.name)}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.2rem' }}
                        title="Remove from board"
                      >×</button>
                    )}
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: status === 'working' ? '#10b981' : status === 'break' ? '#f59e0b' : status === 'prep' ? '#8b5cf6' : '#ef4444' }}></div>
                    {recruiter.name}
                  </td>
                  <td>
                    <select 
                      disabled={!isAdmin && currentUser !== recruiter.name}
                      className={`status-badge ${status}`} 
                      value={status} 
                      onChange={e => handleUpdateStatus(recruiter.name, e.target.value)}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid transparent', background: status === 'working' ? '#10b981' : status === 'Leave' ? '#ef4444' : status === 'break' ? '#f59e0b' : status === 'prep' ? '#8b5cf6' : 'var(--bg-surface-hover)', color: 'white', fontWeight: 'bold' }}
                    >
                      <option value="working">Working</option>
                      <option value="break">Break</option>
                      <option value="prep">Prep</option>
                      <option value="Leave">Leave</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                  <td>
                    <EditableInput 
                      disabled={!isAdmin}
                      placeholder="e.g. pg-1,5"
                      initialValue={dayTask.leadNum} 
                      onSave={val => handleUpdateRecruiterTask(recruiter.name, 'DAY TIME', 'leadNum', val)} 
                    />
                  </td>
                  <td>
                    <EditableInput 
                      disabled={!isAdmin}
                      placeholder="e.g. pg-6,10"
                      initialValue={eveningTask.leadNum} 
                      onSave={val => handleUpdateRecruiterTask(recruiter.name, 'EVENING TIME', 'leadNum', val)} 
                    />
                  </td>
                  <td>
                    <EditableInput 
                      disabled={!isAdmin}
                      placeholder="HH:MM AM"
                      initialValue={dayTask.startDateAndTime || eveningTask.startDateAndTime || recruiter.shiftStart || ''} 
                      onSave={val => {
                        handleUpdateRecruiterTask(recruiter.name, 'DAY TIME', 'startDateAndTime', val);
                        handleUpdateRecruiterTask(recruiter.name, 'EVENING TIME', 'startDateAndTime', val);
                      }} 
                    />
                  </td>
                  <td>
                    <EditableInput 
                      disabled={!isAdmin}
                      placeholder="HH:MM PM"
                      initialValue={dayTask.endTime || eveningTask.endTime || recruiter.shiftEnd || ''} 
                      onSave={val => {
                        handleUpdateRecruiterTask(recruiter.name, 'DAY TIME', 'endTime', val);
                        handleUpdateRecruiterTask(recruiter.name, 'EVENING TIME', 'endTime', val);
                      }} 
                    />
                  </td>
                </tr>
              );
            })}
            {wlRecruiters.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No recruiters found in the system.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WeeklyWL;
