import React, { useState, useEffect } from 'react';
import './App.css';

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

function App() {
  const [gridData, setGridData] = useState({});
  const [activeColor, setActiveColor] = useState(null);

  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(null); // null = Calendar View

  const [reportDayObj, setReportDayObj] = useState(null);
  const [showReport, setShowReport] = useState(false);

  const [monthDays, setMonthDays] = useState([]);

  // Load data from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('interviewTrackerData');
    if (saved) {
      try {
        setGridData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved data");
      }
    }
  }, []);

  // Save data to local storage on change
  useEffect(() => {
    localStorage.setItem('interviewTrackerData', JSON.stringify(gridData));
  }, [gridData]);

  // Compute days when navigating into a month
  useEffect(() => {
    if (currentMonth !== null) {
      const days = [];
      const date = new Date(currentYear, currentMonth, 1);
      while (date.getMonth() === currentMonth) {
        if (date.getDay() !== 0) { // 0 is Sunday
          days.push({
            dateNum: date.getDate(),
            dayName: WEEKDAYS[date.getDay()],
            label: `${date.getDate()} ${MONTHS[currentMonth].substring(0, 3)} (${WEEKDAYS[date.getDay()].substring(0, 3)})`
          });
        }
        date.setDate(date.getDate() + 1);
      }
      setMonthDays(days);
      if (days.length > 0) setReportDayObj(days[0]);
    }
  }, [currentMonth, currentYear]);

  const handleCellChange = (dateNum, time, text) => {
    const cellKey = `${currentYear}-${currentMonth}-${dateNum}-${time}`;
    setGridData(prev => ({
      ...prev,
      [cellKey]: {
        ...prev[cellKey],
        text
      }
    }));
  };

  const handleCellClick = (dateNum, time) => {
    if (activeColor !== null) {
      const cellKey = `${currentYear}-${currentMonth}-${dateNum}-${time}`;
      setGridData(prev => ({
        ...prev,
        [cellKey]: {
          ...prev[cellKey],
          color: activeColor === 'erase' ? null : activeColor.hex,
          textColor: activeColor === 'erase' ? null : activeColor.textColor
        }
      }));
    }
  };

  const handleCellStatus = (e, dateNum, time, status) => {
    e.stopPropagation();
    const cellKey = `${currentYear}-${currentMonth}-${dateNum}-${time}`;
    setGridData(prev => ({
      ...prev,
      [cellKey]: {
        ...prev[cellKey],
        status: prev[cellKey]?.status === status ? null : status
      }
    }));
  };

  const handleKeyDown = (e, indexInMonth, time) => {
    if (e.key === 'Enter') {
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
      e.preventDefault();

      const nextIndex = indexInMonth + 1;
      if (nextIndex < monthDays.length) {
        const nextDate = monthDays[nextIndex].dateNum;
        const nextCellId = `cell-${nextDate}-${time}`;
        document.getElementById(nextCellId)?.focus();
      } else {
        e.target.blur();
      }
    }
  };

  const renderDailyReport = () => {
    if (!showReport || !reportDayObj) return null;

    const doneList = [];
    const missedList = [];

    TIME_SLOTS.forEach(time => {
      const cellKey = `${currentYear}-${currentMonth}-${reportDayObj.dateNum}-${time}`;
      const cell = gridData[cellKey];
      if (cell && cell.text) {
        if (cell.status === 'done') doneList.push({ time, text: cell.text });
        if (cell.status === 'missed') missedList.push({ time, text: cell.text });
      }
    });

    return (
      <div className="report-modal">
        <div className="report-card">
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

          <div className="report-body">
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

  const clearMonth = () => {
    if (window.confirm(`Are you sure you want to clear all data for ${MONTHS[currentMonth]} ${currentYear}? This cannot be undone.`)) {
      const newData = { ...gridData };
      Object.keys(newData).forEach(key => {
        if (key.startsWith(`${currentYear}-${currentMonth}-`)) {
          delete newData[key];
        }
      });
      setGridData(newData);
    }
  };

  // ---------------- Render Calendar Dashboard ----------------
  if (currentMonth === null) {
    return (
      <div className="app-container">
        <header className="header" style={{ flexDirection: 'column', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '3rem' }}>Interview Tracker</h1>
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

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>

          <button
            className="btn-secondary"
            onClick={() => setShowReport(true)}
            style={{ marginLeft: 'auto', background: 'var(--accent-color)', borderColor: 'var(--accent-color)', color: '#fff' }}
          >
            📊 Daily Report
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 8px' }}></div>

          <button className="btn-secondary" onClick={clearMonth}>
            Clear Month
          </button>
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

                    return (
                      <td
                        key={time}
                        className="cell-wrapper"
                        style={{ backgroundColor: bgColor }}
                        onClick={() => handleCellClick(dayObj.dateNum, time)}
                      >
                        <div className="textarea-grid-wrapper" data-replicated-value={(cell.text || '') + ' '}>
                          <textarea
                            id={`cell-${dayObj.dateNum}-${time}`}
                            className={`cell-input ${cell.status || ''}`}
                            style={{ color: textColor }}
                            value={cell.text || ''}
                            onChange={(e) => handleCellChange(dayObj.dateNum, time, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.indexInMonth, time)}
                            placeholder="Name..."
                            rows={1}
                          />
                        </div>
                        {cell.text && (
                          <div className="status-actions">
                            <button
                              className={`status-btn done ${cell.status === 'done' ? 'active' : ''}`}
                              onClick={(e) => handleCellStatus(e, dayObj.dateNum, time, 'done')}
                              title="Mark Done"
                            >✓</button>
                            <button
                              className={`status-btn missed ${cell.status === 'missed' ? 'active' : ''}`}
                              onClick={(e) => handleCellStatus(e, dayObj.dateNum, time, 'missed')}
                              title="Mark Missed"
                            >✗</button>
                          </div>
                        )}
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
    </div>
  );
}

export default App;
