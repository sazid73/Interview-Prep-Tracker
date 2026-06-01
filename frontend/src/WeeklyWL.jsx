import React, { useState, useEffect } from 'react';
import './WeeklyWL.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const EditableInput = ({ initialValue, onSave }) => {
  const [val, setVal] = useState(initialValue || '');
  useEffect(() => { setVal(initialValue || ''); }, [initialValue]);
  return (
    <input 
      type="text" 
      value={val} 
      onChange={e => setVal(e.target.value)} 
      onBlur={() => { if(val !== initialValue) onSave(val); }} 
      onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); }}
    />
  );
};

const WeeklyWL = ({ currentUserRole, currentUser }) => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [wlRecruiters, setWlRecruiters] = useState([]);
  const [newTaskDay, setNewTaskDay] = useState('Monday');
  const [newTaskShift, setNewTaskShift] = useState('DAY TIME');
  const [newTaskLeadNum, setNewTaskLeadNum] = useState('');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const isAdmin = ['super_admin', 'admin', 'admins for task assigns', 'team leader'].includes(currentUserRole);

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
      // default wl recruiters could be all recruiters
      setWlRecruiters(data.filter(u => u.role === 'recruiter' || u.role === 'chaser'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Only admins can assign tasks");
    
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: newTaskDay,
          shift: newTaskShift,
          leadNum: newTaskLeadNum,
          assignedTo: '',
          assignedBy: currentUser,
          status: 'pending',
          taskType: 'Call',
          startDateAndTime: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString(),
          endTime: 'End-Time'
        })
      });
      const data = await res.json();
      if (data.success) {
        setTasks([data.task, ...tasks]);
        setNewTaskLeadNum('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (id, field, value) => {
    if (!isAdmin && currentUserRole !== 'team leader' && currentUserRole !== 'asst. team leader') {
       // Regular users can only update status of their own tasks
       const task = tasks.find(t => t._id === id);
       if (!task || task.assignedTo !== currentUser) {
         return; // not allowed
       }
       if (field !== 'status' && field !== 'notes') return; 
    }

    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
      const data = await res.json();
      if (data.success) {
        setTasks(tasks.map(t => t._id === id ? data.task : t));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this task?")) return;
    try {
      await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
      setTasks(tasks.filter(t => t._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleRandomAssign = async () => {
    if (!isAdmin) return;
    if (wlRecruiters.length === 0) return alert("No recruiters or chasers found in the system.");
    
    const unassignedTasks = tasks.filter(t => !t.assignedTo);
    if (unassignedTasks.length === 0) return alert("All tasks are already assigned!");

    for (const task of unassignedTasks) {
       const randomRecruiter = wlRecruiters[Math.floor(Math.random() * wlRecruiters.length)].name;
       await fetch(`${API_BASE}/api/tasks/${task._id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ assignedTo: randomRecruiter })
       });
    }
    fetchTasks(); // Refresh tasks after bulk update
  };

  const renderTable = (shift) => {
    const shiftTasks = tasks.filter(t => t.shift === shift);
    
    return (
      <div className="wl-table-container">
        <h3 className="wl-shift-title">{shift}</h3>
        <table className="wl-table">
          <thead>
            <tr>
              <th>DAY</th>
              <th>Lead Num</th>
              <th>Recruiter</th>
              <th>Status</th>
              <th>Start date & Time</th>
              <th>End- Time</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {shiftTasks.map(task => (
              <tr key={task._id}>
                <td>
                  <select disabled={!isAdmin} value={task.day} onChange={e => handleUpdateTask(task._id, 'day', e.target.value)} className={`day-badge ${task.day}`}>
                    {days.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </td>
                <td>
                  {isAdmin ? (
                    <EditableInput initialValue={task.leadNum} onSave={val => handleUpdateTask(task._id, 'leadNum', val)} />
                  ) : (
                    <span>{task.leadNum}</span>
                  )}
                </td>
                <td>
                  <select disabled={!isAdmin} value={task.assignedTo || ''} onChange={e => handleUpdateTask(task._id, 'assignedTo', e.target.value)}>
                    <option value="">Unassigned</option>
                    {users.map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                  </select>
                </td>
                <td>
                  <select className={`status-badge ${task.status}`} value={task.status} onChange={e => handleUpdateTask(task._id, 'status', e.target.value)}>
                    <option value="pending">pending</option>
                    <option value="working">working</option>
                    <option value="completed">completed</option>
                    <option value="Leave">Leave</option>
                  </select>
                </td>
                <td>
                  {isAdmin ? (
                    <EditableInput initialValue={task.startDateAndTime} onSave={val => handleUpdateTask(task._id, 'startDateAndTime', val)} />
                  ) : (
                    <span>{task.startDateAndTime}</span>
                  )}
                </td>
                <td>
                  {isAdmin ? (
                    <EditableInput initialValue={task.endTime} onSave={val => handleUpdateTask(task._id, 'endTime', val)} />
                  ) : (
                    <span>{task.endTime}</span>
                  )}
                </td>
                {isAdmin && (
                  <td><button className="del-btn" onClick={() => handleDeleteTask(task._id)}>✗</button></td>
                )}
              </tr>
            ))}
            {shiftTasks.length === 0 && (
              <tr><td colSpan={isAdmin ? 7 : 6} style={{textAlign: 'center', padding: '1rem'}}>No tasks for this shift</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="wl-container">
      <div className="wl-header">
        <h2>Weekly Work List (WL)</h2>
        <div className="wl-actions">
          {isAdmin && (
            <div className="admin-wl-tools">
              <form onSubmit={handleAddTask} className="add-task-form">
                <select value={newTaskDay} onChange={e => setNewTaskDay(e.target.value)}>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={newTaskShift} onChange={e => setNewTaskShift(e.target.value)}>
                  <option value="DAY TIME">DAY TIME</option>
                  <option value="EVENING TIME">EVENING TIME</option>
                </select>
                <input type="text" placeholder="Lead Num (e.g. pg-1,10)" value={newTaskLeadNum} onChange={e => setNewTaskLeadNum(e.target.value)} required />
                <button type="submit" className="add-btn">+ Add Lead Row</button>
              </form>
              <button onClick={handleRandomAssign} className="random-btn">🎲 Randomly Assign Unassigned</button>
            </div>
          )}
        </div>
      </div>

      <div className="wl-split-view">
        {renderTable('DAY TIME')}
        {renderTable('EVENING TIME')}
      </div>
    </div>
  );
};

export default WeeklyWL;
