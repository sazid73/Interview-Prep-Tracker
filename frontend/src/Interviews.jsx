import React, { useState, useEffect } from 'react';
import './Interviews.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Interviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [editingCell, setEditingCell] = useState({ id: null, field: null });
  const [filterWeek, setFilterWeek] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', college: '', recruiter: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState({ show: false, interview: null, newDate: '' });
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/interviews`);
      const data = await res.json();
      setInterviews(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCellEdit = async (id, field, value) => {
    setEditingCell({ id: null, field: null });
    
    if (field === 'status' && value === 'reschedule') {
      const inv = interviews.find(i => i._id === id);
      setRescheduleModal({ show: true, interview: inv, newDate: '' });
      return;
    }
    
    // Optimistic update
    setInterviews(prev => prev.map(inv => inv._id === id ? { ...inv, [field]: value } : inv));

    try {
      await fetch(`${API_BASE}/api/interviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this interview?")) return;
    
    setInterviews(prev => prev.filter(inv => inv._id !== id));
    try {
      await fetch(`${API_BASE}/api/interviews/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!rescheduleModal.newDate) return alert("Please select a new date");
    const id = rescheduleModal.interview._id;
    
    // Update both date and status
    setInterviews(prev => prev.map(inv => inv._id === id ? { ...inv, date: rescheduleModal.newDate, status: 'rescheduled' } : inv));
    
    try {
      await fetch(`${API_BASE}/api/interviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: rescheduleModal.newDate, status: 'rescheduled' })
      });
    } catch (err) {
      console.error(err);
    }
    setRescheduleModal({ show: false, interview: null, newDate: '' });
  };

  const seedTestData = async () => {
    const testData = [
      { intake: 'May 26', date: '1-May-2026', studentName: 'Marcela Kovacova', status: 'failed', college: 'GBS', subject: 'Business and tourism', pendingAction: '', comments: 'not respond,vm', recruiter: 'Fahmida (Monika)' },
      { intake: 'May 26', date: '1-May-2026', studentName: 'Viktoria slepcikova', status: 'failed', college: 'GBS', subject: 'Business and tourism', pendingAction: '', comments: 'not respond,vm', recruiter: 'Fahmida (Monika)' },
      { intake: 'May 26', date: '1-May-2026', studentName: 'Najib Ettammli', status: 'Pass', college: 'Cecos', subject: 'Business MGT', pendingAction: '', comments: 'Attended', recruiter: 'Mahzabin' },
      { intake: 'May 26', date: '1-May-2026', studentName: 'Safvan Ali Umarji Patel', status: 'Pass', college: 'GBS', subject: 'Computing', pendingAction: '', comments: 'offer accepted', recruiter: 'Fahmida' },
      { intake: 'May 26', date: '5-May-2026', studentName: 'Fahim Ashraf', status: 'missed', college: 'GBS', subject: 'CON MWF', pendingAction: 'has some personal issue defer for sep26', comments: '', recruiter: 'Amika' },
      { intake: 'May 26', date: '6-May-2026', studentName: 'Saira Ahmed', status: 'missed', college: 'LCCA', subject: 'Hospitality Mgt', pendingAction: '', comments: '', recruiter: 'Fahmida' },
      { intake: 'May 26', date: '6-May-2026', studentName: 'Ladislave Balaz', status: 'Pass', college: 'LCCA', subject: 'OPT', pendingAction: 'OPT Pass', comments: '', recruiter: 'Amika' },
      { intake: 'May 26', date: '7-May-2026', studentName: 'Adam Gleaves Mark', status: 'failed', college: 'GBS', subject: 'Computing', pendingAction: '', comments: 'will go for vcad', recruiter: 'Sazid' },
      { intake: 'Sep 26', date: '7-May-2026', studentName: 'Behrooz Pakezhad', status: 'failed', college: 'LSC', subject: 'Cert HE BM', pendingAction: 'process for gbs sep 26', comments: '', recruiter: 'Amika' },
      { intake: 'May 26', date: '7-May-2026', studentName: 'Zaneta Bakova', status: 'Pass', college: 'VCAD', subject: '', pendingAction: '', comments: 'cl rcvd by his partner,in the campus', recruiter: 'Fahmida (David)' },
      { intake: 'May 26', date: '7-May-2026', studentName: 'Katerina Zigova', status: 'Pass', college: 'VCAD', subject: '', pendingAction: '', comments: 'call went direct vm', recruiter: 'Fahmida (David)' },
      { intake: 'May 26', date: '7-May-2026', studentName: 'Lucie Krostanova', status: 'missed', college: 'VCAD', subject: '', pendingAction: '', comments: 'spoke. she is on the way', recruiter: 'Fahmida (David)' },
      { intake: 'May 26', date: '7-May-2026', studentName: 'Milan Kroka Junior', status: 'Pass', college: 'VCAD', subject: '', pendingAction: '', comments: 'already is in campus', recruiter: 'Fahmida (David)' },
      { intake: 'May 26', date: '7-May-2026', studentName: 'Zuzuna Holubova', status: 'Pass', college: 'VCAD', subject: '', pendingAction: '', comments: 'already is in campus', recruiter: 'Fahmida (David)' },
      { intake: 'May 26', date: '8-May-2026', studentName: 'Said Abdullahi Hassan', status: 'failed', college: 'GBS', subject: 'Bsc in Computing with foundation year', pendingAction: '', comments: 'call went direct vm', recruiter: 'Sabrina' },
      { intake: 'May 26', date: '8-May-2026', studentName: 'Delwar Hussain', status: 'missed', college: 'GBS', subject: 'HND Business', pendingAction: '', comments: 'call went direct vm', recruiter: 'Sabrina' },
      { intake: 'May 26', date: '8-May-2026', studentName: 'Gull Allim', status: 'Pass', college: 'LCCA', subject: '', pendingAction: '', comments: '', recruiter: 'Ahasan' },
      { intake: 'May 26', date: '8-May-2026', studentName: 'Prince Ashok Solanki', status: 'Pass', college: 'LCCA', subject: '', pendingAction: '', comments: '', recruiter: 'Fahmida' },
      { intake: 'May 26', date: '8-May-2026', studentName: 'Ronak Premji', status: 'Pass', college: 'LCCA', subject: '', pendingAction: '', comments: '', recruiter: 'Fahmida' },
      { intake: 'May 26', date: '9-May-2026', studentName: 'Raj Solanki', status: 'Pass', college: 'LCCA', subject: '', pendingAction: '', comments: '', recruiter: 'Fahmida' },
      { intake: 'May 26', date: '9-May-2026', studentName: 'Najma Maria Dolinska', status: 'Pass', college: 'LCCA', subject: '', pendingAction: '', comments: '', recruiter: 'Fahmida' },
      { intake: 'May 26', date: '7-May-2026', studentName: 'Emiliya Nikolaeva Anastasova', status: 'Pass', college: 'VCAD', subject: '', pendingAction: '', comments: '', recruiter: 'Fahmida' },
      { intake: 'May 26', date: '9-May-2026', studentName: 'Isiaka susoko Cham', status: 'missed', college: 'GBS', subject: 'Bsc in construction M WF', pendingAction: '', comments: '', recruiter: 'Amika' },
      { intake: 'May 26', date: '9-May-2026', studentName: 'Ebrima Saidykhan', status: 'missed', college: 'GBS', subject: 'Bsc HSC WF', pendingAction: '', comments: '', recruiter: 'Amika' },
      { intake: 'May 26', date: '9-May-2026', studentName: 'Maher Sabah Al Kheir', status: 'missed', college: 'GBS', subject: 'BSc (Hons) Construction Management with Foundation Year', pendingAction: '', comments: '', recruiter: 'Aryan' },
      { intake: 'May 26', date: '9-May-2026', studentName: 'Hala Hassan', status: 'missed', college: 'GBS', subject: 'BSc (Hons) Health, Wellbeing and Social Care with Foundation Year', pendingAction: '', comments: '', recruiter: 'Aryan' },
      { intake: 'May 26', date: '10-May-2026', studentName: 'Sadick Adam Ibrahim', status: 'Pass', college: 'GBS', subject: 'BSc (Hons) Computing with Foundation Year', pendingAction: 'awaiting SFE', comments: '', recruiter: 'Fahmida' },
      { intake: 'May 26', date: '13-May-2026', studentName: 'Ernest Ananeh Firempong', status: 'Pass', college: 'LSC', subject: 'Cert HE Health and Social Care', pendingAction: 'awaiting SFE', comments: '', recruiter: 'Sabrina' },
      { intake: 'May 26', date: '14-May-2026', studentName: 'Omar Alikhail', status: 'failed', college: 'GBS', subject: 'BA (Hons) Global Business and Entrepreneurship with Foundation Year', pendingAction: '', comments: 'Call directly went to vm', recruiter: 'Fahmida' },
      { intake: 'May 26', date: '14-May-2026', studentName: 'Julia Kocmierowska', status: 'Pass', college: 'GBS', subject: 'BA (Hons) Global Business and Entrepreneurship with Foundation Year', pendingAction: '', comments: 'call not respond,vm', recruiter: 'Fahmida' },
      { intake: 'June 26', date: '14-May-2026', studentName: 'Monika Lakova', status: 'pending', college: 'VCAD', subject: 'Cert HE BM', pendingAction: '', comments: 'call not connected', recruiter: 'Fahmida (Monika)' },
      { intake: 'May 26', date: '14-May-2026', studentName: 'Maher Sabah Al Kheir', status: 'failed', college: 'GBS', subject: 'HND Construction', pendingAction: '', comments: 'spoke over phone,will attend', recruiter: 'Aryan' },
      { intake: 'May 26', date: '15-May-2026', studentName: 'Ngor Jacob Matiob', status: 'attended, awaiting', college: 'LSC', subject: 'Cert HE Health and Social Care', pendingAction: '', comments: '', recruiter: 'Kevin' },
      { intake: 'June 26', date: '22-May-2026', studentName: 'Nadeem Akhtar', status: 'pending', college: 'VCAD', subject: 'Fashion Media and Marketing', pendingAction: '', comments: '', recruiter: 'Kevin/Omer' },
      { intake: 'June 26', date: '19-May-2026', studentName: 'Stephen Scott', status: 'Pass', college: 'GBS', subject: 'BA (Hons) Global Business and Entrepreneurship with Foundation Year', pendingAction: '', comments: '', recruiter: 'Ahasan' },
      { intake: 'May 26', date: '21-May-2026', studentName: 'Taha Benrabha', status: 'Pass', college: 'VCAD', subject: 'Cert HE BM', pendingAction: '', comments: '', recruiter: 'Sazid' },
    ];

    for (const data of testData) {
      await fetch(`${API_BASE}/api/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    }
    fetchInterviews();
  };

  const formatInterviewDate = (dateString) => {
    if (!dateString) return '';
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear().toString().slice(-2);
      return `${day}-${month}-${year}`; 
    }
    return dateString;
  };

  const renderCell = (row, field, type = 'text') => {
    const isEditing = editingCell.id === row._id && editingCell.field === field;
    
    if (field === 'status') {
      if (isEditing) {
        return (
          <select 
            autoFocus
            defaultValue={row[field]}
            onChange={(e) => handleCellEdit(row._id, field, e.target.value)}
            onBlur={() => setEditingCell({ id: null, field: null })}
            style={{ color: '#fff', background: '#374151' }}
          >
            <option value="Pass">Pass</option>
            <option value="failed">Failed</option>
            <option value="missed">Missed</option>
            <option value="pending" disabled hidden>Pending</option>
            <option value="rescheduled">Pending</option>
            <option value="reschedule">Reschedule...</option>
          </select>
        );
      }
      return (
        <span 
          className={`status-badge status-${(row[field] || 'pending').toLowerCase().replace(/[^a-z0-9]/g, '-')}`} 
          onClick={() => setEditingCell({ id: row._id, field })}
          style={{ cursor: 'pointer' }}
        >
          {row[field] || 'pending'}
        </span>
      );
    }

    if (isEditing) {
      return (
        <input 
          type={type}
          autoFocus
          defaultValue={row[field]}
          onBlur={(e) => handleCellEdit(row._id, field, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        />
      );
    }

    let displayValue = row[field] || ' ';
    if (field === 'date' && !isEditing) {
      displayValue = formatInterviewDate(row[field]);
    }

    return (
      <span onClick={() => setEditingCell({ id: row._id, field })} style={{ cursor: 'text', display: 'block', minHeight: '1.5rem', width: '100%' }}>
        {displayValue}
      </span>
    );
  };

  const getMonthYear = (dateString) => {
    if (!dateString) return '';
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const date = new Date(dateString);
      const m = date.toLocaleString('default', { month: 'short' });
      const y = date.getFullYear();
      return `${m}-${y}`;
    }
    if (dateString.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}$/)) {
      const parts = dateString.split('-');
      return `${parts[1]}-${parts[2]}`;
    }
    return '';
  };

  const parseDateForSorting = (dateString) => {
    if (!dateString) return 0;
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return new Date(dateString).getTime();
    if (dateString.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}$/)) {
      const parts = dateString.split('-');
      return new Date(`${parts[1]} ${parts[0]}, ${parts[2]}`).getTime();
    }
    return 0;
  };

  const getWeekNumber = (dateString) => {
    let day = 1;
    let month = 0;
    let year = 2026;
    if (!dateString) return 1;
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateString.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else if (dateString.match(/^\d{1,2}-[A-Za-z]{3}-\d{4}$/)) {
      const d = new Date(dateString);
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }
    
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon=0, Sun=6
    
    return Math.ceil((day + offset) / 7);
  };

  const uniqueMonths = [...new Set(interviews.map(inv => getMonthYear(inv.date)).filter(Boolean))];

  useEffect(() => {
    if (filterWeek === 'All' && uniqueMonths.length > 0) {
      const current = new Date();
      const currentMY = `${current.toLocaleString('default', { month: 'short' })}-${current.getFullYear()}`;
      if (uniqueMonths.includes(currentMY)) {
        setFilterWeek(currentMY);
      } else {
        setFilterWeek(uniqueMonths[0]);
      }
    }
  }, [interviews]);

  const filteredInterviews = interviews.filter(inv => {
    const matchesWeek = filterWeek === 'All' || getMonthYear(inv.date) === filterWeek;
    const matchesSearch = !searchTerm || (inv.studentName && inv.studentName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !filters.status || (inv.status || '').toLowerCase() === filters.status;
    const matchesCollege = !filters.college || inv.college === filters.college;
    const matchesRecruiter = !filters.recruiter || inv.recruiter === filters.recruiter;
    return matchesWeek && matchesSearch && matchesStatus && matchesCollege && matchesRecruiter;
  });

  const groupedByWeek = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  filteredInterviews.forEach(inv => {
    const w = getWeekNumber(inv.date);
    if (groupedByWeek[w]) groupedByWeek[w].push(inv);
  });

  const groupedInterviews = [];
  [1, 2, 3, 4, 5].forEach(w => {
    if (groupedByWeek[w].length > 0 || filterWeek !== 'All') {
      const passCount = groupedByWeek[w].filter(i => (i.status || '').toLowerCase() === 'pass').length;
      const failCount = groupedByWeek[w].filter(i => (i.status || '').toLowerCase() === 'failed').length;
      const rescheduledCount = groupedByWeek[w].filter(i => (i.status || '').toLowerCase() === 'rescheduled').length;
      const bookedCount = groupedByWeek[w].length;
      
      groupedByWeek[w].sort((a, b) => parseDateForSorting(a.date) - parseDateForSorting(b.date));
      
      groupedInterviews.push({ 
        isSeparator: true, 
        isTargetMet: passCount >= 15,
        label: `Week-${w} Target- 15 pass   (Booked: ${bookedCount} | Passed: ${passCount} | Failed: ${failCount} | Rescheduled: ${rescheduledCount})` 
      });
      groupedInterviews.push(...groupedByWeek[w]);
    }
  });

  const getRecruiterStats = () => {
    const stats = {};
    [1, 2, 3, 4, 5].forEach(w => {
      groupedByWeek[w].forEach(inv => {
        let rawR = inv.recruiter || 'Unassigned';
        // Extract core name (e.g. "Fahmida (David)" -> "Fahmida", "Kevin/Omer" -> "Kevin")
        let r = rawR.split(/[\s/]/)[0] || 'Unassigned';
        
        if (!stats[r]) stats[r] = { 1: { pass: 0, fail: 0 }, 2: { pass: 0, fail: 0 }, 3: { pass: 0, fail: 0 }, 4: { pass: 0, fail: 0 }, 5: { pass: 0, fail: 0 }, total: 0, totalPass: 0, totalFail: 0 };
        stats[r].total++;
        if ((inv.status || '').toLowerCase() === 'pass') { stats[r][w].pass++; stats[r].totalPass++; }
        if ((inv.status || '').toLowerCase() === 'failed') { stats[r][w].fail++; stats[r].totalFail++; }
      });
    });
    return Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
  };
  const recruiterStats = getRecruiterStats();

  return (
    <div className="interviews-container">
      <div className="interviews-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Weekly MI</h2>
          <select className="week-filter-select" value={filterWeek} onChange={e => setFilterWeek(e.target.value)}>
            <option value="All">All Months</option>
            {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input 
            type="text" 
            placeholder="🔍 Search name.." 
            style={{ padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            ⧨ Filters
          </button>
          <button className="btn-secondary" onClick={() => setShowAnalyticsModal(true)}>
            📊 Show Analytics
          </button>
        </div>
        
        {interviews.length < 30 && (
          <button className="btn-add-test" onClick={seedTestData}>
            Populate Test Data
          </button>
        )}
      </div>

      {showFilters && (
        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
            <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <option value="">All</option>
              <option value="pass">Pass</option>
              <option value="failed">Failed</option>
              <option value="rescheduled">Rescheduled</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>College</label>
            <select value={filters.college} onChange={e => setFilters({...filters, college: e.target.value})} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <option value="">All</option>
              {[...new Set(interviews.map(i => i.college).filter(Boolean))].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Recruiter</label>
            <select value={filters.recruiter} onChange={e => setFilters({...filters, recruiter: e.target.value})} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <option value="">All</option>
              {[...new Set(interviews.map(i => i.recruiter).filter(Boolean))].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => { setFilters({ status: '', college: '', recruiter: '' }); setSearchTerm(''); }} style={{ padding: '0.4rem 1rem', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clear Filters</button>
          </div>
        </div>
      )}

      <div className="interviews-table-wrapper">
        <table className="interviews-table">
          <thead>
            <tr>
              <th>Intake</th>
              <th>Date</th>
              <th>Student's name</th>
              <th>Pass/Fail</th>
              <th>College</th>
              <th>Subject</th>
              <th>Pending action</th>
              <th>Comments</th>
              <th>Recruiter</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedInterviews.map((row, idx) => {
              if (row.isSeparator) {
                return (
                  <tr key={`sep-${idx}`} className={`week-separator ${row.isTargetMet ? 'target-met' : 'target-below'}`}>
                    <td colSpan="10">{row.label}</td>
                  </tr>
                );
              }

              return (
                <tr key={row._id || idx}>
                  <td>{renderCell(row, 'intake')}</td>
                  <td>{renderCell(row, 'date')}</td>
                  <td>{renderCell(row, 'studentName')}</td>
                  <td>{renderCell(row, 'status')}</td>
                  <td>{renderCell(row, 'college')}</td>
                  <td>{renderCell(row, 'subject')}</td>
                  <td>{renderCell(row, 'pendingAction')}</td>
                  <td>{renderCell(row, 'comments')}</td>
                  <td>{renderCell(row, 'recruiter')}</td>
                  <td className="action-cell">
                    <button className="delete-btn" title="Delete" onClick={() => handleDelete(row._id)}>🗑️</button>
                  </td>
                </tr>
              );
            })}
            
            {groupedInterviews.length === 0 && (
              <tr>
                <td colSpan="10" style={{ padding: '2rem' }}>No interviews found. Click "Populate Test Data" to add entries.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rescheduleModal.show && (
        <div className="reschedule-modal-overlay">
          <div className="reschedule-modal">
            <h3>Reschedule Interview</h3>
            <p style={{marginBottom: '1rem'}}>
              Rescheduling <strong>{rescheduleModal.interview.studentName}</strong>
            </p>
            <div className="input-group">
              <label>New Date</label>
              <input 
                type="date" 
                value={rescheduleModal.newDate} 
                onChange={e => setRescheduleModal({...rescheduleModal, newDate: e.target.value})} 
                style={{ width: '100%', padding: '0.8rem', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="reschedule-actions">
              <button className="btn-secondary" onClick={() => setRescheduleModal({show: false, interview: null, newDate: ''})} style={{ flex: 1 }}>Cancel</button>
              <button className="btn-primary" onClick={handleRescheduleSubmit} style={{ flex: 1, whiteSpace: 'nowrap' }}>Confirm Reschedule</button>
            </div>
          </div>
        </div>
      )}

      {showAnalyticsModal && (
        <div className="reschedule-modal-overlay" style={{ zIndex: 2000 }}>
          <div className="reschedule-modal" style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Recruiter Analytics ({filterWeek})</h2>
              <button className="btn-secondary" onClick={() => setShowAnalyticsModal(false)}>Close</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
              {recruiterStats.map(([recruiter, data]) => {
                const winRate = data.total > 0 ? Math.round((data.totalPass / data.total) * 100) : 0;
                return (
                  <div key={recruiter} style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '12px', border: '1px solid #374151' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ margin: 0, color: '#f3f4f6' }}>{recruiter}</h3>
                      <div style={{ background: '#374151', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', color: '#9ca3af' }}>
                        {data.total} Booked
                      </div>
                    </div>
                    
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.5rem' }}>
                      <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#4ade80' }}>{data.totalPass}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Passed</div>
                      </div>
                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#f87171' }}>{data.totalFail}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Failed</div>
                      </div>
                      <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#60a5fa' }}>{winRate}%</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Win Rate</div>
                      </div>
                    </div>

                    {/* Advanced Vertical Bar Chart */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '120px', paddingBottom: '10px', borderBottom: '1px solid #374151' }}>
                      {[1, 2, 3, 4, 5].map(w => {
                        const maxVal = Math.max(...[1,2,3,4,5].map(wk => data[wk].pass + data[wk].fail)) || 1;
                        const pHeight = ((data[w].pass / maxVal) * 100) || 0;
                        const fHeight = ((data[w].fail / maxVal) * 100) || 0;
                        
                        return (
                          <div key={w} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '18%' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100px', width: '100%' }}>
                              {/* Pass Column */}
                              <div style={{ width: '50%', height: `${pHeight}%`, background: 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                                {data[w].pass > 0 && <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#4ade80' }}>{data[w].pass}</span>}
                              </div>
                              {/* Fail Column */}
                              <div style={{ width: '50%', height: `${fHeight}%`, background: 'linear-gradient(180deg, #f87171 0%, #ef4444 100%)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                                {data[w].fail > 0 && <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: '#f87171' }}>{data[w].fail}</span>}
                              </div>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>W{w}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {recruiterStats.length === 0 && <p style={{color: '#9ca3af', textAlign: 'center'}}>No data available for this month.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Interviews;
