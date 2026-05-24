import React, { useState, useEffect } from 'react';
import './App.css';
import { io } from 'socket.io-client';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const TIME_SLOTS = [
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM",
  "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM",
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM"
];

const COLORS = [
  { id: '3 Available', hex: '#bbf7d0', textColor: '#166534', label: '3 Coaches (Green)' },
  { id: '2 Available', hex: '#fef08a', textColor: '#854d0e', label: '2 Coaches (Yellow)' },
  { id: '1 Available', hex: '#fecaca', textColor: '#991b1b', label: '1 Coach (Light Red)' },
  { id: '0 Available', hex: '#dc2626', textColor: '#ffffff', label: '0 Coaches (Red)' },
];

const PRESET_MATRIX = {
  Monday: [0, 0, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1],
  Tuesday: [1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 0, 0],
  Wednesday: [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 0, 0],
  Thursday: [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 0, 0],
  Friday: [2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 1, 0, 0],
  Saturday: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
  Sunday: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

const getPresetColor = (day, time) => {
  const timeIndex = TIME_SLOTS.indexOf(time);
  const availability = PRESET_MATRIX[day]?.[timeIndex] || 0;

  if (availability === 3) return COLORS[0]; // Green
  if (availability === 2) return COLORS[1]; // Yellow
  if (availability === 1) return COLORS[2]; // Light Red
  return COLORS[3]; // Red
};

const getSlotsCount = (hex) => {
  if (hex === COLORS[0].hex) return 3; // Green
  if (hex === COLORS[1].hex) return 2; // Yellow
  if (hex === COLORS[2].hex) return 1; // Light Red
  return 0; // Red
};

const getSlots = (cell) => {
  if (cell.slots) return cell.slots;
  if (cell.text !== undefined) return [{ text: cell.text, status: cell.status }];
  return [];
};

const getDaysInMonth = (year, month) => {
  const days = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    if (date.getDay() !== 0) { // skip sunday
      days.push(date.getDate());
    }
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const normalizeName = (name) => {
  if (!name) return '';
  return name.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

const API_BASE = import.meta.env.VITE_API_URL || '';

const LoginScreen = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (name.trim().length > 1 && password.trim().length > 0) {
      try {
        const res = await fetch(`${API_BASE}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, password })
        });
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Login failed');
        } else {
          onLogin(data.name, data.role);
        }
      } catch (err) {
        console.error("Login API failed", err);
        setError('Network error. Backend might be down.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-surface)', padding: '3rem', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', width: '400px', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Welcome to Tracker</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Please log in to continue</p>
        
        <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Employee Name</label>
          <input 
            type="text" 
            autoFocus
            required
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            placeholder="e.g. John Doe"
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '1rem' }}
          />
          
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Password</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter your password"
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', fontSize: '1rem' }}
          />
          
          {error && <div style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem', fontWeight: 600 }}>{error}</div>}
        </div>
        
        <button type="submit" style={{ width: '100%', padding: '0.8rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
          Login
        </button>
      </form>
    </div>
  );
};

function App() {
  const [gridData, setGridData] = useState({});
  const [activeColor, setActiveColor] = useState(null);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(null); // null = Calendar View

  const [reportDayObj, setReportDayObj] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [serverLogs, setServerLogs] = useState([]);
  const [expandedAnalytics, setExpandedAnalytics] = useState({});
  const [activeEditors, setActiveEditors] = useState({});
  const [rescheduleData, setRescheduleData] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('trackerUser') || null);
  const [currentUserRole, setCurrentUserRole] = useState(() => localStorage.getItem('trackerRole') || 'standard');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminUsersList, setAdminUsersList] = useState([]);
  
  // State for Admin creating a new user
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('standard');
  const [newUserError, setNewUserError] = useState('');

  const [monthDays, setMonthDays] = useState([]);
  
  const [historyModalData, setHistoryModalData] = useState(null);
  const [cellHistory, setCellHistory] = useState([]);
  const initialTextRefs = React.useRef({});

  const toggleAnalyticsExpand = (key) => {
    setExpandedAnalytics(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const typingTimeoutRef = React.useRef({});

  const syncCellToServer = (key, cellObj) => {
    const socketId = window.appSocket ? window.appSocket.id : '';
    fetch(`${API_BASE}/api/grid/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Socket-ID': socketId },
      body: JSON.stringify(cellObj)
    }).catch(err => console.error("Failed to sync cell", err));
  };

  const logActivity = (action, details, overrideUser = null) => {
    const userToLog = overrideUser || currentUser;
    if (!userToLog) return;
    const logData = {
      timestamp: new Date().toLocaleString(),
      user: userToLog,
      action,
      details
    };
    fetch(`${API_BASE}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData)
    }).catch(err => console.error("Failed to log activity", err));
  };

  // Load data from server on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/grid`)
      .then(res => res.json())
      .then(data => setGridData(data))
      .catch(err => console.error("Failed to load grid data", err));
  }, []);

  // Fetch logs when modal opens
  useEffect(() => {
    if (showLogs) {
      fetch(`${API_BASE}/api/logs`)
        .then(res => res.json())
        .then(data => setServerLogs(data))
        .catch(err => console.error("Failed to load logs", err));
    }
  }, [showLogs]);

  // Fetch admin users list when modal opens
  useEffect(() => {
    if (showAdminModal && currentUserRole === 'admin') {
      fetch(`${API_BASE}/api/users`)
        .then(res => res.json())
        .then(data => setAdminUsersList(data))
        .catch(err => console.error("Failed to load users", err));
    }
  }, [showAdminModal, currentUserRole]);

  // Fetch cell history when history modal opens
  useEffect(() => {
    if (historyModalData) {
      fetch(`${API_BASE}/api/history/${historyModalData.cellKey}/${historyModalData.slotIndex}`)
        .then(res => res.json())
        .then(data => setCellHistory(data))
        .catch(err => console.error(err));
    } else {
      setCellHistory([]);
    }
  }, [historyModalData]);

  // Connect WebSocket for Real-Time Live Sync
  useEffect(() => {
    const socketUrl = API_BASE || 'http://localhost:5000';
    const socket = io(socketUrl);
    window.appSocket = socket;

    socket.on('cell_updated', (data) => {
      setGridData(prev => ({
        ...prev,
        [data.key]: data.cell
      }));
    });

    socket.on('month_cleared', (data) => {
      setGridData(prev => {
        const newData = { ...prev };
        Object.keys(newData).forEach(key => {
          if (key.startsWith(`${data.year}-${data.month}-`)) {
            delete newData[key];
          }
        });
        return newData;
      });
    });

    socket.on('user_focus', (data) => {
      setActiveEditors(prev => ({ ...prev, [`${data.key}-${data.slotIndex}`]: data.user }));
    });

    socket.on('user_blur', (data) => {
      setActiveEditors(prev => {
        const next = { ...prev };
        delete next[`${data.key}-${data.slotIndex}`];
        return next;
      });
    });

    socket.on('user_typing', (data) => {
      setGridData(prev => {
        const cell = prev[data.key] || {};
        const slots = cell.slots ? [...cell.slots] : [{}, {}, {}];
        slots[data.slotIndex] = { ...slots[data.slotIndex], text: data.text };
        return { ...prev, [data.key]: { ...cell, slots } };
      });
    });

    return () => {
      socket.disconnect();
      window.appSocket = null;
    };
  }, []);



  // Compute days when navigating into a month
  useEffect(() => {
    if (currentMonth !== null) {
      const days = getDaysInMonth(currentYear, currentMonth).map(dateNum => {
        const date = new Date(currentYear, currentMonth, dateNum);
        return {
          dateNum,
          dayName: WEEKDAYS[date.getDay()],
          label: `${dateNum} ${MONTHS[currentMonth].substring(0, 3)} (${WEEKDAYS[date.getDay()].substring(0, 3)})`
        };
      });
      setMonthDays(days);
      if (days.length > 0) setReportDayObj(days[0]);
    }
  }, [currentMonth, currentYear]);

  const handleSlotChange = (dateNum, time, slotIndex, text) => {
    const cellKey = `${currentYear}-${currentMonth}-${dateNum}-${time}`;
    setGridData(prev => {
      const cell = prev[cellKey] || {};
      const slots = getSlots(cell);
      const newSlots = [...slots];
      const oldText = newSlots[slotIndex]?.text || '';
      
      newSlots[slotIndex] = { ...newSlots[slotIndex], text };

      const newCell = { ...cell, slots: newSlots };
      
      // Debounce the server sync to prevent DB flooding
      if (typingTimeoutRef.current[cellKey]) clearTimeout(typingTimeoutRef.current[cellKey]);
      typingTimeoutRef.current[cellKey] = setTimeout(() => {
        syncCellToServer(cellKey, newCell);
      }, 1000);

      // Instantly broadcast keystrokes via WebSocket for Google Sheets feel
      if (window.appSocket) {
        window.appSocket.emit('user_typing', { key: cellKey, slotIndex, text });
      }

      return {
        ...prev,
        [cellKey]: newCell
      };
    });
  };

  const handleCellClick = (dateNum, time) => {
    if (activeColor !== null) {
      const cellKey = `${currentYear}-${currentMonth}-${dateNum}-${time}`;
      setGridData(prev => {
        const currentCell = prev[cellKey] || {};
        const newCell = {
          ...currentCell,
          color: activeColor === 'erase' ? null : activeColor.hex,
          textColor: activeColor === 'erase' ? null : activeColor.textColor
        };
        syncCellToServer(cellKey, newCell);
        logActivity('Painted Cell', `Painted ${MONTHS[currentMonth]} ${dateNum} at ${time} to ${activeColor === 'erase' ? 'default' : activeColor.label}`);
        return { ...prev, [cellKey]: newCell };
      });
    }
  };

  const handleSlotStatus = (e, dateNum, time, slotIndex, status) => {
    e.stopPropagation();
    const cellKey = `${currentYear}-${currentMonth}-${dateNum}-${time}`;
    
    const currentCell = gridData[cellKey] || {};
    const currentSlots = getSlots(currentCell);
    const slot = currentSlots[slotIndex] || {};
    const currentStatus = slot.status;

    let empName = null;
    if (status === 'done' && currentStatus !== 'done') {
       empName = window.prompt("Who completed this prep? (Employee Name):", slot.employeeDoneBy || "");
       if (empName === null) return;
    }

    setGridData(prev => {
      const cell = prev[cellKey] || {};
      const slots = getSlots(cell);
      const newSlots = [...slots];
      const prevStatus = newSlots[slotIndex]?.status;

      const nextStatus = prevStatus === status ? null : status;
      newSlots[slotIndex] = { ...newSlots[slotIndex], status: nextStatus };
      
      if (status === 'done' && nextStatus === 'done') {
         newSlots[slotIndex].employeeDoneBy = empName.trim();
      } else if (status === 'done' && nextStatus === null) {
         delete newSlots[slotIndex].employeeDoneBy;
      }

      const newCell = { ...cell, slots: newSlots };
      syncCellToServer(cellKey, newCell);

      return {
        ...prev,
        [cellKey]: newCell
      };
    });
  };

  const handleRescheduleClick = (e, dateNum, time, slotIndex) => {
    e.stopPropagation();
    const cellKey = `${currentYear}-${currentMonth}-${dateNum}-${time}`;
    const cell = gridData[cellKey] || {};
    const slots = getSlots(cell);
    const slot = slots[slotIndex];
    if (!slot || !slot.text) return;

    if (slot.status === 'rescheduled') {
      handleSlotStatus(e, dateNum, time, slotIndex, 'rescheduled');
      return;
    }

    setRescheduleData({
      sourceDateNum: dateNum,
      sourceTime: time,
      sourceSlotIndex: slotIndex,
      text: slot.text,
      selectedTarget: null
    });
  };


  const handleKeyDown = (e, indexInMonth, time, slotIndex) => {
    if (e.key === 'Enter') {
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();

      const nextIndex = indexInMonth + 1;
      if (nextIndex < monthDays.length) {
        const nextDate = monthDays[nextIndex].dateNum;
        const nextCellId = `cell-${nextDate}-${time}-${slotIndex}`;
        const el = document.getElementById(nextCellId);
        if (el) el.focus();
        else document.getElementById(`cell-${nextDate}-${time}-0`)?.focus() || e.target.blur();
      } else {
        e.target.blur();
      }
    }
  };

  const renderRescheduleModal = () => {
    if (!rescheduleData) return null;

    const upcomingOptions = [];
    let currentDate = new Date(currentYear, currentMonth, rescheduleData.sourceDateNum);
    let daysChecked = 0;
    
    while (daysChecked < 4) {
      if (currentDate.getDay() !== 0) {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const d = currentDate.getDate();
        const dayName = WEEKDAYS[currentDate.getDay()];
        
        TIME_SLOTS.forEach(time => {
          if (y === currentYear && m === currentMonth && d === rescheduleData.sourceDateNum && time === rescheduleData.sourceTime) {
             return;
          }

          const cellKey = `${y}-${m}-${d}-${time}`;
          const cell = gridData[cellKey] || {};
          const slots = getSlots(cell);
          
          const presetColor = getPresetColor(dayName, time);
          const bgColor = cell.color || presetColor.hex;
          const numSlots = getSlotsCount(bgColor);
          
          let emptyCount = 0;
          for (let i = 0; i < numSlots; i++) {
             if (!slots[i] || !slots[i].text) emptyCount++;
          }
          
          if (emptyCount > 0) {
             upcomingOptions.push({
               id: cellKey,
               year: y,
               month: m,
               dateNum: d,
               time: time,
               label: `${MONTHS[m].substring(0,3)} ${d} (${dayName.substring(0,3)}) - ${time} (${emptyCount} slot${emptyCount > 1 ? 's' : ''} free)`
             });
          }
        });
        daysChecked++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const currentSelection = rescheduleData.selectedTarget || upcomingOptions[0]?.id;

    const handleConfirm = () => {
      if (!currentSelection) return;
      
      const targetOption = upcomingOptions.find(o => o.id === currentSelection);
      if (!targetOption) return;

      setGridData(prev => {
        const newData = { ...prev };
        
        const targetKey = targetOption.id;
        const targetCell = newData[targetKey] || {};
        const targetSlots = getSlots(targetCell);
        
        const tDate = new Date(targetOption.year, targetOption.month, targetOption.dateNum);
        const dayName = WEEKDAYS[tDate.getDay()];
        const presetColor = getPresetColor(dayName, targetOption.time);
        const bgColor = targetCell.color || presetColor.hex;
        const numSlots = getSlotsCount(bgColor);

        const newTargetSlots = [
          targetSlots[0] || {}, 
          targetSlots[1] || {}, 
          targetSlots[2] || {}
        ];

        let foundEmpty = -1;
        for (let i = 0; i < numSlots; i++) {
          if (!newTargetSlots[i].text) {
            foundEmpty = i;
            break;
          }
        }

        if (foundEmpty === -1) {
          alert(`Cannot reschedule. That slot was filled while you were waiting.`);
          return prev;
        }

        newTargetSlots[foundEmpty] = { text: rescheduleData.text, status: null };
        const newTargetCell = { ...targetCell, slots: newTargetSlots };
        newData[targetKey] = newTargetCell;

        const sourceKey = `${currentYear}-${currentMonth}-${rescheduleData.sourceDateNum}-${rescheduleData.sourceTime}`;
        const sourceCell = newData[sourceKey] || {};
        const sourceSlots = getSlots(sourceCell);
        const newSourceSlots = [...sourceSlots];
        newSourceSlots[rescheduleData.sourceSlotIndex] = {
          ...newSourceSlots[rescheduleData.sourceSlotIndex],
          status: 'rescheduled'
        };
        const newSourceCell = { ...sourceCell, slots: newSourceSlots };
        newData[sourceKey] = newSourceCell;

        syncCellToServer(targetKey, newTargetCell);
        syncCellToServer(sourceKey, newSourceCell);

        logActivity('Rescheduled Booking', `Moved "${rescheduleData.text}" from ${MONTHS[currentMonth]} ${rescheduleData.sourceDateNum} at ${rescheduleData.sourceTime} to ${MONTHS[targetOption.month]} ${targetOption.dateNum} at ${targetOption.time}`);

        return newData;
      });
      setRescheduleData(null);
    };

    return (
      <div className="report-modal">
        <div className="report-card" style={{ width: '500px' }}>
          <div className="report-header">
            <h2>Reschedule Session</h2>
            <button onClick={() => setRescheduleData(null)} className="close-btn">✗</button>
          </div>
          <div style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Moving student: <strong style={{ color: 'var(--text-primary)' }}>{rescheduleData.text}</strong>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Select Empty Slot (Next 4 Working Days):</label>
              {upcomingOptions.length === 0 ? (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  No empty slots available in the next 3 days!
                </div>
              ) : (
                <select 
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  value={currentSelection}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, selectedTarget: e.target.value })}
                >
                  {upcomingOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button className="btn-secondary" onClick={() => setRescheduleData(null)}>Cancel</button>
            <button 
              className="btn-secondary" 
              style={{ background: upcomingOptions.length === 0 ? 'var(--bg-surface-hover)' : '#3b82f6', borderColor: upcomingOptions.length === 0 ? 'var(--border-color)' : '#3b82f6', color: upcomingOptions.length === 0 ? 'var(--text-secondary)' : '#fff', fontWeight: 700, cursor: upcomingOptions.length === 0 ? 'not-allowed' : 'pointer' }}
              onClick={handleConfirm}
              disabled={upcomingOptions.length === 0}
            >
              Confirm Reschedule
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyticsModal = () => {
    if (!showAnalytics) return null;

    const analytics = {
      bookedBy: {},
      doneBy: {}
    };

    Object.keys(gridData).forEach(key => {
      if (!key.startsWith(`${currentYear}-${currentMonth}-`)) return;
      
      const cell = gridData[key];
      const slots = getSlots(cell);
      
      slots.forEach(slot => {
         if (!slot || !slot.text) return;
         
         let dateTimeStr = '';
         const keyParts = key.split('-');
         if (keyParts.length >= 4) {
            const mIdx = Number(keyParts[1]);
            const dNum = keyParts[2];
            const timeStr = keyParts.slice(3).join('-');
            dateTimeStr = `(${MONTHS[mIdx].substring(0,3)} ${dNum} at ${timeStr})`;
         }

         const parts = slot.text.split('-');
         if (parts.length >= 3) {
            const booker = normalizeName(parts[parts.length - 1]);
            if (booker) {
               if (!analytics.bookedBy[booker]) {
                  analytics.bookedBy[booker] = [];
               }
               const studentCollege = parts.slice(0, parts.length - 1).join('-').trim();
               analytics.bookedBy[booker].push(`${studentCollege} ${dateTimeStr}`);
            }
         }

         if (slot.status === 'done' && slot.employeeDoneBy) {
            const emp = normalizeName(slot.employeeDoneBy);
            if (!analytics.doneBy[emp]) {
               analytics.doneBy[emp] = [];
            }
            let studentCollege = slot.text;
            if (parts.length >= 2) {
               studentCollege = parts.slice(0, parts.length > 2 ? parts.length - 1 : parts.length).join('-').trim();
            }
            analytics.doneBy[emp].push(`${studentCollege} ${dateTimeStr}`);
         }
      });
    });

    const sortedBookers = Object.entries(analytics.bookedBy).sort((a, b) => b[1].length - a[1].length);
    const sortedDoneBy = Object.entries(analytics.doneBy).sort((a, b) => b[1].length - a[1].length);

    return (
      <div className="report-modal">
        <div className="report-card" style={{ width: '800px' }}>
          <div className="report-header">
            <h2>Monthly Analytics ({MONTHS[currentMonth]} {currentYear})</h2>
            <button onClick={() => setShowAnalytics(false)} className="close-btn">✗</button>
          </div>
          
          <div className="report-body" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="report-column">
              <h3 style={{ color: '#8b5cf6' }}>📅 Total Preps Booked</h3>
              <ul style={{ padding: 0 }}>
                {sortedBookers.map(([name, preps], i) => (
                  <li key={i} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem', listStyle: 'none' }}>
                    <div 
                      onClick={() => toggleAnalyticsExpand('booked-' + name)}
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', cursor: 'pointer', padding: '4px', borderRadius: '4px', background: expandedAnalytics['booked-' + name] ? 'var(--bg-surface-hover)' : 'transparent', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                      onMouseOut={(e) => e.currentTarget.style.background = expandedAnalytics['booked-' + name] ? 'var(--bg-surface-hover)' : 'transparent'}
                    >
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-block', width: '12px' }}>
                           {expandedAnalytics['booked-' + name] ? '▼' : '▶'}
                         </span>
                         {name}
                      </strong> 
                      <span style={{ background: 'var(--bg-surface)', padding: '0.2rem 0.6rem', borderRadius: '12px', color: '#8b5cf6', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>{preps.length} preps</span>
                    </div>
                    {expandedAnalytics['booked-' + name] && (
                      <ul style={{ paddingLeft: '2.5rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {preps.map((prepText, j) => (
                          <li key={j} style={{ marginBottom: '0.3rem' }}>{prepText}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                {sortedBookers.length === 0 && <li className="empty-text">No proper bookings found (Format: Student-College-Booker)</li>}
              </ul>
            </div>
            
            <div className="report-column">
              <h3 style={{ color: '#10b981' }}>✅ Preps Completed By</h3>
              <ul style={{ padding: 0 }}>
                {sortedDoneBy.map(([name, preps], i) => (
                  <li key={i} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem', listStyle: 'none' }}>
                    <div 
                      onClick={() => toggleAnalyticsExpand('done-' + name)}
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', cursor: 'pointer', padding: '4px', borderRadius: '4px', background: expandedAnalytics['done-' + name] ? 'var(--bg-surface-hover)' : 'transparent', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                      onMouseOut={(e) => e.currentTarget.style.background = expandedAnalytics['done-' + name] ? 'var(--bg-surface-hover)' : 'transparent'}
                    >
                      <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'inline-block', width: '12px' }}>
                           {expandedAnalytics['done-' + name] ? '▼' : '▶'}
                         </span>
                         {name}
                      </strong> 
                      <span style={{ background: 'var(--bg-surface)', padding: '0.2rem 0.6rem', borderRadius: '12px', color: '#10b981', fontSize: '0.9rem', border: '1px solid var(--border-color)' }}>{preps.length} completed</span>
                    </div>
                    {expandedAnalytics['done-' + name] && (
                      <ul style={{ paddingLeft: '2.5rem', margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {preps.map((prepText, j) => (
                          <li key={j} style={{ marginBottom: '0.3rem' }}>{prepText}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                {sortedDoneBy.length === 0 && <li className="empty-text">No preps marked as done by an employee yet</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDailyReport = () => {
    if (!showReport || !reportDayObj) return null;

    const doneList = [];
    const missedList = [];
    const rescheduledList = [];

    TIME_SLOTS.forEach(time => {
      const cellKey = `${currentYear}-${currentMonth}-${reportDayObj.dateNum}-${time}`;
      const cell = gridData[cellKey];
      if (cell) {
        const slots = getSlots(cell);
        slots.forEach(slot => {
          if (slot && slot.text) {
            if (slot.status === 'done') doneList.push({ time, text: slot.text });
            if (slot.status === 'missed') missedList.push({ time, text: slot.text });
            if (slot.status === 'rescheduled') rescheduledList.push({ time, text: slot.text });
          }
        });
      }
    });

    return (
      <div className="report-modal">
        <div className="report-card" style={{ width: '800px' }}>
          <div className="report-header">
            <h2>Daily Report</h2>
            <button onClick={() => setShowReport(false)} className="close-btn">✗</button>
          </div>

          <div className="report-controls">
            <label style={{ marginRight: '1rem' }}>Select Date: </label>
            <select
              value={reportDayObj.dateNum}
              onChange={e => {
                const selected = monthDays.find(d => d.dateNum === Number(e.target.value));
                setReportDayObj(selected);
              }}
            >
              {monthDays.map(dayObj => (
                <option key={dayObj.dateNum} value={dayObj.dateNum}>{dayObj.label}</option>
              ))}
            </select>
          </div>

          <div className="report-body" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="report-column">
              <h3 style={{ color: '#10b981' }}>✅ Done ({doneList.length})</h3>
              <ul>
                {doneList.map((item, i) => (
                  <li key={i}><strong>{item.time}</strong>: {item.text}</li>
                ))}
                {doneList.length === 0 && <li className="empty-text">No completed sessions</li>}
              </ul>
            </div>
            <div className="report-column">
              <h3 style={{ color: '#3b82f6' }}>🔄 Rescheduled ({rescheduledList.length})</h3>
              <ul>
                {rescheduledList.map((item, i) => (
                  <li key={i}><strong>{item.time}</strong>: {item.text}</li>
                ))}
                {rescheduledList.length === 0 && <li className="empty-text">No rescheduled sessions</li>}
              </ul>
            </div>
            <div className="report-column">
              <h3 style={{ color: '#ef4444' }}>❌ Missed ({missedList.length})</h3>
              <ul>
                {missedList.map((item, i) => (
                  <li key={i}><strong>{item.time}</strong>: {item.text}</li>
                ))}
                {missedList.length === 0 && <li className="empty-text">No missed sessions!</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLogsModal = () => {
    if (!showLogs) return null;

    return (
      <div className="report-modal">
        <div className="report-card" style={{ width: '700px' }}>
          <div className="report-header">
            <h2>Activity Logs</h2>
            <button onClick={() => setShowLogs(false)} className="close-btn">✗</button>
          </div>
          
          <div className="report-body" style={{ display: 'block', maxHeight: '60vh', overflowY: 'auto' }}>
            {serverLogs.length === 0 ? (
              <p className="empty-text">No activities recorded yet.</p>
            ) : (
              <ul style={{ padding: 0, listStyle: 'none', margin: 0 }}>
                {serverLogs.map(log => (
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
    );
  };

  const renderAdminModal = () => {
    if (!showAdminModal) return null;

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
        setNewUserRole('standard');
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
        logActivity('Reset Password', `Reset password for user ${name}`);
        alert(`Password for ${name} updated successfully!`);
      } catch (err) {
        alert('Failed to update password');
      }
    };

    const handleDeleteUser = async (name) => {
      if (name.toLowerCase() === 'admin') {
        alert("Cannot delete the Genesis Admin!");
        return;
      }
      if (!window.confirm(`Are you absolutely sure you want to delete ${name}? This will permanently revoke their access.`)) return;
      
      try {
        await fetch(`${API_BASE}/api/users/${name}`, { method: 'DELETE' });
        logActivity('Deleted User', `Deleted user ${name}`);
        setAdminUsersList(prev => prev.filter(u => u.name !== name));
      } catch (err) {
        alert('Failed to delete user');
      }
    };

    return (
      <div className="report-modal">
        <div className="report-card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div className="report-header">
            <h2>👥 Manage Access</h2>
            <button onClick={() => setShowAdminModal(false)} className="close-btn">✗</button>
          </div>
          
          <div style={{ padding: '1.5rem' }}>
            <div style={{ background: 'var(--bg-surface-hover)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--text-primary)' }}>Create New User</h3>
              <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Name</label>
                  <input required value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="e.g. Jane" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Password</label>
                  <input required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="password" placeholder="Password" style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.3rem' }}>Role</label>
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    <option value="standard">Standard</option>
                    <option value="special">Special (Paint Access)</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn-secondary" style={{ width: '100%', background: '#10b981', color: 'white', borderColor: '#10b981' }}>+ Create User</button>
                </div>
              </form>
              {newUserError && <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.9rem' }}>{newUserError}</div>}
            </div>

            <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Existing Users</h3>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.5rem' }}>User Name</th>
                  <th style={{ padding: '0.5rem' }}>Role</th>
                  <th style={{ padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsersList.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 'bold' }}>{u.name}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <select
                        value={u.role}
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
                        <option value="standard">Standard</option>
                        <option value="special">Special (Paint Access)</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleResetPassword(u.name)}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Reset Pass
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.name)}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryModal = () => {
    if (!historyModalData) return null;

    return (
      <div className="report-modal">
        <div className="report-card" style={{ width: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div className="report-header">
            <h2>Edit History (Slot {historyModalData.slotIndex + 1})</h2>
            <button onClick={() => setHistoryModalData(null)} className="close-btn">✗</button>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {historyModalData.month} {historyModalData.dateNum} at {historyModalData.time}
            </p>
            {cellHistory.length === 0 ? (
              <p>No edit history found for this cell.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cellHistory.map((entry, idx) => (
                  <li key={idx} style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '1.05rem' }}>{entry.user}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{entry.timestamp}</span>
                    </div>
                    {entry.oldText && !entry.newText ? (
                       <span style={{ color: '#ef4444' }}>Deleted <span style={{ background: 'rgba(239,68,68,0.2)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>"{entry.oldText}"</span></span>
                    ) : !entry.oldText && entry.newText ? (
                       <span style={{ color: '#10b981' }}>Added <span style={{ background: 'rgba(16,185,129,0.2)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>"{entry.newText}"</span></span>
                    ) : (
                       <span>Changed <s style={{ color: '#ef4444', opacity: 0.8 }}>"{entry.oldText}"</s> to <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.2)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>"{entry.newText}"</span></span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  };

  const clearMonth = () => {
    if (window.confirm(`Are you sure you want to clear all data for ${MONTHS[currentMonth]} ${currentYear}? This cannot be undone.`)) {
      setGridData(prev => {
        const newData = { ...prev };
        Object.keys(newData).forEach(key => {
          if (key.startsWith(`${currentYear}-${currentMonth}-`)) {
            delete newData[key];
          }
        });
        return newData;
      });
      fetch(`${API_BASE}/api/grid/month?year=${currentYear}&month=${currentMonth}`, { method: 'DELETE' }).catch(e => console.error(e));
      logActivity('Cleared Month', `Cleared all data for ${MONTHS[currentMonth]} ${currentYear}`);
    }
  };

  // ---------------- Render Calendar Dashboard ----------------
  if (!currentUser) {
    return (
      <LoginScreen onLogin={(name, role) => {
        localStorage.setItem('trackerUser', name);
        localStorage.setItem('trackerRole', role);
        setCurrentUser(name);
        setCurrentUserRole(role);
        logActivity('Login', 'User logged in', name);
      }} />
    );
  }

  if (currentMonth === null) {
    return (
      <div className="app-container">
        <header className="header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          
          <div style={{ alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
             {currentUserRole === 'admin' && (
               <button className="btn-secondary" style={{ background: '#ec4899', color: 'white', borderColor: '#ec4899', whiteSpace: 'nowrap' }} onClick={() => setShowAdminModal(true)}>👥 Manage Access</button>
             )}
             <span style={{ color: 'var(--text-secondary)' }}>Logged in as <strong style={{ color: 'var(--text-primary)' }}>{currentUser}</strong> ({currentUserRole})</span>
             <button className="btn-secondary" onClick={() => { logActivity('Logout', 'User logged out'); localStorage.removeItem('trackerUser'); localStorage.removeItem('trackerRole'); setCurrentUser(null); }}>Logout</button>
          </div>

          <h1 style={{ fontSize: '3rem', margin: 0 }}>Interview Tracker</h1>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <button className="btn-secondary" style={{ fontSize: '1.2rem', padding: '0.8rem 1.5rem' }} onClick={() => setCurrentYear(y => y - 1)}>←</button>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{currentYear}</span>
            <button className="btn-secondary" style={{ fontSize: '1.2rem', padding: '0.8rem 1.5rem' }} onClick={() => setCurrentYear(y => y + 1)}>→</button>
          </div>
        </header>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '1.5rem',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}>
          {MONTHS.map((month, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentMonth(idx)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = 'var(--border-focus)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>{month}</h2>
            </div>
          ))}
        </div>
        {renderAdminModal()}
      </div>
    );
  }

  // ---------------- Render Tracker Grid ----------------
  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <button
            className="btn-secondary"
            style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}
            onClick={() => setCurrentMonth(null)}
          >
            ← Core
          </button>
          <h1>{MONTHS[currentMonth]} {currentYear}</h1>
        </div>

        <div className="toolbar">
          {(currentUserRole === 'admin' || currentUserRole === 'special') && (
            <div className="toolbar-group">
              <span className="toolbar-label">Paint:</span>
              {COLORS.map(color => (
                <button
                  key={color.id}
                  className={`color-btn-labeled ${activeColor?.hex === color.hex ? 'active' : ''}`}
                  style={{ backgroundColor: color.hex, color: color.textColor }}
                  onClick={() => setActiveColor(activeColor?.hex === color.hex ? null : color)}
                  title={color.id}
                >
                  {color.label}
                </button>
              ))}
              <button
                className={`color-btn-labeled erase ${activeColor === 'erase' ? 'active' : ''}`}
                onClick={() => setActiveColor(activeColor === 'erase' ? null : 'erase')}
                title="Erase Color"
              >
                ✗ Erase
              </button>
            </div>
          )}

          {(currentUserRole === 'admin' || currentUserRole === 'special') && (
            <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
          )}

          <button
            className="btn-secondary"
            onClick={() => setShowReport(true)}
            style={{ marginLeft: 'auto', background: 'var(--accent-color)', borderColor: 'var(--accent-color)', color: '#fff' }}
          >
            📊 Daily Report
          </button>
          
          <button
            className="btn-secondary"
            onClick={() => setShowAnalytics(true)}
            style={{ background: '#8b5cf6', borderColor: '#8b5cf6', color: '#fff' }}
          >
            📈 Analytics
          </button>

          <button
            className="btn-secondary"
            onClick={() => setShowLogs(true)}
            style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#fff' }}
          >
            📋 Logs
          </button>

          {currentUserRole === 'admin' && (
            <>
              <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>
              <button className="btn-secondary" onClick={clearMonth}>
                Clear Month
              </button>
            </>
          )}
        </div>
      </header>

      <div className="table-wrapper">
        <table className="tracker-table">
          <thead>
            <tr>
              <th className="row-header">Date</th>
              {TIME_SLOTS.map(time => (
                <th key={time}>{time}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthDays.reduce((acc, dayObj, idx) => {
              if (idx === 0) {
                acc.weeks = 1;
                acc.rows.push({ type: 'separator', label: `Week ${acc.weeks}` });
              } else {
                const prev = monthDays[idx - 1].dayName;
                // Since Sunday is skipped, the transition from Saturday to Monday is a new week
                if (prev === 'Saturday' && dayObj.dayName === 'Monday') {
                  acc.weeks++;
                  acc.rows.push({ type: 'separator', label: `Week ${acc.weeks}` });
                }
                // also cater to month start edge cases, e.g. Sunday to Monday, though Sunday is skipped.
              }
              acc.rows.push({ type: 'day', data: dayObj, indexInMonth: idx });
              return acc;
            }, { rows: [], weeks: 0 }).rows.map((item, idx) => {
              if (item.type === 'separator') {
                return (
                  <tr key={`sep-${idx}`} className="week-separator">
                    <td className="row-header" style={{
                      background: 'var(--bg-surface-hover) !important',
                      color: 'var(--text-primary)',
                      padding: '0.8rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      borderBottom: '3px solid var(--border-focus)',
                      borderTop: '3px solid var(--border-focus)',
                    }}>
                      {item.label}
                    </td>
                    {TIME_SLOTS.map((time, tidx) => (
                      <td key={`sep-time-${tidx}`} style={{
                        background: 'var(--bg-surface-hover)',
                        color: 'var(--text-secondary)',
                        padding: '0.8rem 1rem',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        borderBottom: '3px solid var(--border-focus)',
                        borderTop: '3px solid var(--border-focus)',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.label === 'Week 1' ? '' : time}
                      </td>
                    ))}
                  </tr>
                );
              }

              const dayObj = item.data;
              return (
                <tr key={dayObj.dateNum}>
                  <th className="row-header">{dayObj.label}</th>
                  {TIME_SLOTS.map(time => {
                    const cellKey = `${currentYear}-${currentMonth}-${dayObj.dateNum}-${time}`;
                    const cell = gridData[cellKey] || {};

                    const presetColor = getPresetColor(dayObj.dayName, time);
                    const bgColor = cell.color || presetColor.hex;
                    const textColor = cell.color ? cell.textColor : presetColor.textColor;

                    const numSlots = getSlotsCount(bgColor);
                    const cellSlots = getSlots(cell);

                    return (
                      <td
                        key={time}
                        className="cell-wrapper"
                        style={{ backgroundColor: bgColor }}
                        onClick={() => handleCellClick(dayObj.dateNum, time)}
                      >
                        <div className="slots-container">
                          {Array.from({ length: 3 }).map((_, slotIndex) => {
                            const isOpen = slotIndex < numSlots;
                            const slot = cellSlots[slotIndex] || {};

                            return (
                              <div key={slotIndex} className={`slot-wrapper ${!isOpen ? 'closed' : ''}`} style={{ position: 'relative' }}>
                                {isOpen ? (
                                  <>
                                    {activeEditors[`${cellKey}-${slotIndex}`] && activeEditors[`${cellKey}-${slotIndex}`] !== currentUser && (
                                      <div style={{ position: 'absolute', top: '-18px', left: '4px', background: '#ec4899', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
                                        {activeEditors[`${cellKey}-${slotIndex}`]} is typing...
                                      </div>
                                    )}
                                    <div className="textarea-grid-wrapper" data-replicated-value={(slot.text || '') + ' '}>
                                      <textarea
                                        id={`cell-${dayObj.dateNum}-${time}-${slotIndex}`}
                                        className={`cell-input ${slot.status || ''}`}
                                        style={{ 
                                          color: textColor,
                                          borderColor: activeEditors[`${cellKey}-${slotIndex}`] && activeEditors[`${cellKey}-${slotIndex}`] !== currentUser ? '#ec4899' : undefined,
                                          borderWidth: activeEditors[`${cellKey}-${slotIndex}`] && activeEditors[`${cellKey}-${slotIndex}`] !== currentUser ? '2px' : undefined
                                        }}
                                        value={slot.text || ''}
                                        onFocus={() => {
                                          initialTextRefs.current[`${cellKey}-${slotIndex}`] = slot.text || '';
                                          window.appSocket && window.appSocket.emit('user_focus', { key: cellKey, slotIndex, user: currentUser });
                                        }}
                                        onBlur={() => {
                                          const initialText = initialTextRefs.current[`${cellKey}-${slotIndex}`] || '';
                                          const currentText = slot.text || '';
                                          if (initialText !== currentText) {
                                            fetch(`${API_BASE}/api/history`, {
                                              method: 'POST',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                cellKey,
                                                slotIndex,
                                                user: currentUser,
                                                timestamp: new Date().toLocaleString(),
                                                oldText: initialText,
                                                newText: currentText
                                              })
                                            });
                                          }
                                          window.appSocket && window.appSocket.emit('user_blur', { key: cellKey, slotIndex });
                                        }}
                                        onContextMenu={(e) => {
                                          e.preventDefault();
                                          setHistoryModalData({ cellKey, slotIndex, time, dateNum: dayObj.dateNum, month: MONTHS[currentMonth] });
                                        }}
                                        onChange={(e) => handleSlotChange(dayObj.dateNum, time, slotIndex, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, item.indexInMonth, time, slotIndex)}
                                        placeholder={`Slot ${slotIndex + 1}...`}
                                        rows={1}
                                      />
                                    </div>
                                    {slot.text && (
                                      <div className="status-actions">
                                        <button
                                          className={`status-btn done ${slot.status === 'done' ? 'active' : ''}`}
                                          onClick={(e) => handleSlotStatus(e, dayObj.dateNum, time, slotIndex, 'done')}
                                          title="Mark Done"
                                        >✓</button>
                                        <button
                                          className={`status-btn rescheduled ${slot.status === 'rescheduled' ? 'active' : ''}`}
                                          onClick={(e) => handleRescheduleClick(e, dayObj.dateNum, time, slotIndex)}
                                          title="Reschedule Session"
                                        >🔄</button>
                                        <button
                                          className={`status-btn missed ${slot.status === 'missed' ? 'active' : ''}`}
                                          onClick={(e) => handleSlotStatus(e, dayObj.dateNum, time, slotIndex, 'missed')}
                                          title="Mark Missed"
                                        >✗</button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="closed-slot-placeholder"></div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {renderDailyReport()}
      {renderRescheduleModal()}
      {renderAnalyticsModal()}
      {renderLogsModal()}
      {renderAdminModal()}
      {renderHistoryModal()}
    </div>
  );
}

export default App;
