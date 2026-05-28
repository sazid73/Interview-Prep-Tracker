import React, { useState, useEffect } from 'react';
import './StudentsDMS.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const StudentsDMS = ({ setCurrentView }) => {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [jumpPage, setJumpPage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('Details');
  const [editingCell, setEditingCell] = useState({ id: null, field: null });
  const [chaserModal, setChaserModal] = useState({ show: false, student: null, readOnly: false });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ appStatus: '', recruiter: '', session: '' });
  const initialStudentState = {
    name: '', email: '', mobile: '', source: 'manual entry', session: '', 
    courseAndCampus1: '', courseAndCampus2: '', refCompany: '', intStatus: 'Interested and Responding',
    recruiter: '', chaser: 'Click to assign', agent: '', residential: '', location: '', appId: '',
    clTime: '', submit: '', docs: '0'
  };
  const [newStudent, setNewStudent] = useState(initialStudentState);
  const [isViewMode, setIsViewMode] = useState(false);
  const [bookingModal, setBookingModal] = useState({ show: false, student: null, date: '', time: '10:00', campus: '', notes: '' });

  useEffect(() => {
    fetch(`${API_BASE}/api/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      if (newStudent._id) {
        // Edit existing student
        const res = await fetch(`${API_BASE}/api/students/${newStudent._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newStudent)
        });
        const data = await res.json();
        if (data.success) {
          setStudents(students.map(s => s._id === newStudent._id ? data.student : s));
          setShowAddModal(false);
          setNewStudent(initialStudentState);
        }
      } else {
        // Add new student
        const res = await fetch(`${API_BASE}/api/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newStudent)
        });
        const data = await res.json();
        if (data.success) {
          setStudents([data.student, ...students]);
          setShowAddModal(false);
          setNewStudent(initialStudentState);
        }
      }
    } catch (error) {
      console.error(error);
      alert('Error saving student');
    }
  };

  const handleOpenAddModal = () => {
    setNewStudent(initialStudentState);
    setActiveModalTab('Details');
    setIsViewMode(false);
    setShowAddModal(true);
  };

  const handleEditStudent = (student, viewOnly = false) => {
    setNewStudent(student);
    setActiveModalTab('Details');
    setIsViewMode(viewOnly);
    setShowAddModal(true);
  };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookingModal.date || !bookingModal.time) return alert("Please select date and time");
    
    const key = `interview-${bookingModal.date}-${bookingModal.time}`;
    try {
      await fetch(`${API_BASE}/api/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake: bookingModal.student.session || 'May 26',
          date: bookingModal.date,
          studentName: bookingModal.student.name,
          status: 'pending',
          college: bookingModal.campus || '',
          subject: bookingModal.student.courseAndCampus1 || '',
          pendingAction: '',
          comments: bookingModal.notes,
          recruiter: bookingModal.student.recruiter || ''
        })
      });

      alert('Interview scheduled! It will appear on the calendar (Interviews) page.');
      setBookingModal({ ...bookingModal, show: false });
      if (setCurrentView) setCurrentView('interviews');
    } catch (err) {
      console.error(err);
      alert('Error booking interview');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.studentId && s.studentId.includes(searchTerm));
    
    const matchesApp = !filters.appStatus || s.appStatus === filters.appStatus;
    const matchesRecruiter = !filters.recruiter || (s.recruiter && s.recruiter.includes(filters.recruiter));
    const matchesSession = !filters.session || s.session === filters.session;

    return matchesSearch && matchesApp && matchesRecruiter && matchesSession;
  });

  const uniqueRecruiters = [...new Set(students.map(s => s.recruiter).filter(Boolean))];
  const uniqueSessions = [...new Set(students.map(s => s.session).filter(Boolean))];

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / rowsPerPage));
  const currentData = filteredStudents.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleJumpPage = () => {
    const pageNum = parseInt(jumpPage, 10);
    if (!isNaN(pageNum)) {
      handlePageChange(pageNum);
      setJumpPage('');
    }
  };

  const handleCellEdit = async (studentId, field, newValue) => {
    setEditingCell({ id: null, field: null });
    const targetStudent = students.find(s => s._id === studentId);
    if (!targetStudent || targetStudent[field] === newValue) return;

    const updatedStudent = { ...targetStudent, [field]: newValue };
    setStudents(students.map(s => s._id === studentId ? updatedStudent : s));

    try {
      await fetch(`${API_BASE}/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleChaserChange = async (type, val) => {
    if (chaserModal.readOnly) return;
    const student = chaserModal.student;
    const currentChasers = student.chasers || { cv: '', ps: '', sub: '', qa: '' };
    const newChasers = { ...currentChasers, [type]: val };
    
    setChaserModal({ show: true, student: { ...student, chasers: newChasers }, readOnly: false });
    setStudents(students.map(s => s._id === student._id ? { ...s, chasers: newChasers } : s));
    
    try {
      await fetch(`${API_BASE}/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chasers: newChasers })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleChaserDone = async () => {
    const student = chaserModal.student;
    
    // Auto-update status to Submission ongoing
    const newStatus = 'Submission ongoing';
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
    
    setChaserModal({ show: false, student: null, readOnly: false });
  };

  const renderAppStatusCell = (student) => {
    const isEditing = editingCell.id === student._id && editingCell.field === 'appStatus';
    const status = student.appStatus || 'Awaiting submission';
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '1.5rem' }}>
        {isEditing ? (
          <select 
            autoFocus 
            defaultValue={status} 
            onChange={(e) => handleCellEdit(student._id, 'appStatus', e.target.value)}
            onBlur={() => setEditingCell({ id: null, field: null })}
            style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)' }}
          >
            <option value="Awaiting submission">Awaiting submission</option>
            <option value="Submission ongoing">Submission ongoing</option>
            <option value="Submitted">Submitted</option>
          </select>
        ) : (
          <span 
            onClick={() => setEditingCell({ id: student._id, field: 'appStatus' })} 
            style={{ cursor: 'pointer', color: status === 'Submitted' ? '#34d399' : status === 'Submission ongoing' ? '#60a5fa' : '#fbbf24', fontWeight: 'bold' }}
          >
            {status}
          </span>
        )}
        {status === 'Awaiting submission' && !isEditing && (
          <button 
            title="Assign Chasers" 
            onClick={() => setChaserModal({ show: true, student, readOnly: false })} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
          >
            🧑‍💼
          </button>
        )}
        {status === 'Submission ongoing' && !isEditing && (
          <button 
            title="View Chasers" 
            onClick={() => setChaserModal({ show: true, student, readOnly: true })} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
          >
            👁️
          </button>
        )}
        {status === 'Submitted' && !isEditing && (
          <button 
            title="View Chasers" 
            onClick={() => setChaserModal({ show: true, student, readOnly: true })} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0 4px' }}
          >
            ✅
          </button>
        )}
      </div>
    );
  };

  const renderCell = (student, field, placeholder = '—') => {
    const isEditing = editingCell.id === student._id && editingCell.field === field;
    if (isEditing) {
      if (field === 'recruiter' || field === 'chaser') {
        return (
          <select 
            autoFocus 
            defaultValue={student[field]} 
            onBlur={(e) => handleCellEdit(student._id, field, e.target.value)}
            style={{ width: '100%', padding: '0.2rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)' }}
          >
            <option value="">Select</option>
            {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
          </select>
        );
      }
      return (
        <input 
          autoFocus
          defaultValue={student[field]}
          onBlur={(e) => handleCellEdit(student._id, field, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          style={{ width: '100%', padding: '0.2rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)' }}
        />
      );
    }
    return <span onClick={() => setEditingCell({ id: student._id, field })} style={{ cursor: 'text', display: 'block', minHeight: '1.5rem' }}>{student[field] || placeholder}</span>;
  };

  return (
    <div className="dms-container">
      <div className="dms-accordion">
        <div className="dms-accordion-header">
          <span>📍 Distance Search</span>
          <span>▼</span>
        </div>
      </div>

      <div className="dms-toolbar">
        <div className="dms-toolbar-left">
          <input 
            type="text" 
            placeholder="🔍 Search.." 
            className="dms-search" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select className="dms-rows-select" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="dms-toolbar-right" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="dms-btn-filter" onClick={() => setShowFilters(!showFilters)}>⧨ Filters</button>
          <button className="dms-btn-add" onClick={handleOpenAddModal}>+ Add Student</button>
        </div>
      </div>

      {showFilters && (
        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>App Status</label>
            <select value={filters.appStatus} onChange={e => setFilters({...filters, appStatus: e.target.value})} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <option value="">All</option>
              <option value="Awaiting submission">Awaiting submission</option>
              <option value="Submission ongoing">Submission ongoing</option>
              <option value="Submitted">Submitted</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Recruiter</label>
            <select value={filters.recruiter} onChange={e => setFilters({...filters, recruiter: e.target.value})} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <option value="">All</option>
              {uniqueRecruiters.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Session</label>
            <select value={filters.session} onChange={e => setFilters({...filters, session: e.target.value})} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              <option value="">All</option>
              {uniqueSessions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={() => setFilters({ appStatus: '', recruiter: '', session: '' })} style={{ padding: '0.4rem 1rem', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clear</button>
          </div>
        </div>
      )}

      <div className="dms-table-wrapper">
        <table className="dms-table">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>#</th>
              <th>SOURCES</th>
              <th>RECRUITER</th>
              <th>CREATED</th>
              <th>MODIFIED</th>
              <th>SESSION</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>MOBILE</th>
              <th>COURSE & CAMPUS 1</th>
              <th>APP STATUS</th>
              <th>INT STATUS</th>
              <th>CHASER</th>
              <th>AGENT</th>
              <th>RESIDENTIAL</th>
              <th>LOCATION</th>
              <th>APPL ID</th>
              <th>CL TIME</th>
              <th>REF. COMPANY</th>
              <th>DOCS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="23" style={{ textAlign: 'center', padding: '2rem' }}>No records found.</td>
              </tr>
            )}
            {currentData.map((student, idx) => (
              <tr key={student._id || idx} className={student.statusType === 'red' ? 'row-red' : ''}>
                <td><input type="checkbox" /></td>
                <td className="id-col">{student.studentId}</td>
                <td>{student.source || '—'}</td>
                <td>{renderCell(student, 'recruiter')}</td>
                <td>{student.createdAt}</td>
                <td>{student.modifiedAt}</td>
                <td>
                  <span className={student.session ? "session-badge" : ""}>
                    {student.session}
                  </span>
                </td>
                <td className="name-col">{student.name}</td>
                <td>{renderCell(student, 'email')}</td>
                <td>{renderCell(student, 'mobile')}</td>
                <td>{renderCell(student, 'courseAndCampus1')}</td>
                <td>{renderAppStatusCell(student)}</td>
                <td>
                  {editingCell.id === student._id && editingCell.field === 'intStatus' ? (
                    <select 
                      autoFocus 
                      defaultValue={student.intStatus} 
                      onBlur={(e) => handleCellEdit(student._id, 'intStatus', e.target.value)}
                      style={{ background: 'var(--bg-color)', color: 'var(--text-primary)' }}
                    >
                      <option value="Interested and Responding">Interested and Responding</option>
                      <option value="Interested - Awaiting Docs">Interested - Awaiting Docs</option>
                      <option value="Interested - Further Info Required">Interested - Further Info Required</option>
                      <option value="Fully Enrolled">Fully Enrolled</option>
                      <option value="Not eligible - Check Later">Not eligible - Check Later</option>
                      <option value="Awaiting SFE">Awaiting SFE</option>
                      <option value="Awaiting Prep">Awaiting Prep</option>
                    </select>
                  ) : (
                    <span className="int-badge" onClick={() => setEditingCell({ id: student._id, field: 'intStatus' })} style={{ cursor: 'pointer' }}>
                      {student.intStatus || 'Interested'}
                    </span>
                  )}
                </td>
                <td style={{ color: '#9ca3af' }}>{renderCell(student, 'chaser', 'Click to assign')}</td>
                <td>{renderCell(student, 'agent')}</td>
                <td>{renderCell(student, 'residential')}</td>
                <td>{renderCell(student, 'location')}</td>
                <td style={{ color: '#818cf8' }}>{student.appId || '—'}</td>
                <td>{student.clTime || '—'}</td>
                <td>{student.refCompany || '—'}</td>
                <td>
                  <span className="docs-badge">📄 {student.docs || '0'}</span>
                </td>
                <td className="actions-cell">
                  <button className="action-btn view-btn" title="View" onClick={() => handleEditStudent(student, true)}>👁️</button>
                  <button className="action-btn edit-btn" title="Edit" onClick={() => handleEditStudent(student, false)}>✏️</button>
                  <button className="action-btn book-btn" title="Book Interview" onClick={() => setBookingModal({ show: true, student, date: '', time: '10:00', campus: '', notes: '' })}>💼</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dms-pagination">
        <div className="pagination-info">
          Showing {filteredStudents.length === 0 ? 0 : ((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, filteredStudents.length)} of {filteredStudents.length} entries
        </div>
        <div className="pagination-controls">
          <button className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`} onClick={() => handlePageChange(currentPage - 1)}>{"<"}</button>
          
          <button className={`page-btn ${currentPage === 1 ? 'active' : ''}`} onClick={() => handlePageChange(1)}>1</button>
          
          {currentPage > 3 && <span className="page-dots">...</span>}
          
          {currentPage > 2 && <button className="page-btn" onClick={() => handlePageChange(currentPage - 1)}>{currentPage - 1}</button>}
          
          {currentPage !== 1 && currentPage !== totalPages && (
             <button className="page-btn active">{currentPage}</button>
          )}
          
          {currentPage < totalPages - 1 && <button className="page-btn" onClick={() => handlePageChange(currentPage + 1)}>{currentPage + 1}</button>}
          
          {currentPage < totalPages - 2 && <span className="page-dots">...</span>}
          
          {totalPages > 1 && (
            <button className={`page-btn ${currentPage === totalPages ? 'active' : ''}`} onClick={() => handlePageChange(totalPages)}>{totalPages}</button>
          )}
          
          <button className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`} onClick={() => handlePageChange(currentPage + 1)}>{">"}</button>
        </div>
        <div className="pagination-jump">
          <input type="text" placeholder="Enter page" value={jumpPage} onChange={(e) => setJumpPage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleJumpPage()} />
          <button onClick={handleJumpPage}>Go</button>
        </div>
      </div>

      {showAddModal && (
        <div className="dms-modal-overlay">
          <div className="dms-modal">
            <div className="dms-modal-header">
              <h3>{isViewMode ? 'View Student' : newStudent._id ? 'Edit Student' : 'Add Student'}</h3>
              <button onClick={() => setShowAddModal(false)}>✗</button>
            </div>
            <div className="dms-modal-tabs">
              {['Details', 'Address', 'Others', 'Documents'].map(tab => (
                <button 
                  key={tab} 
                  type="button" 
                  className={`dms-tab-btn ${activeModalTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveModalTab(tab)}
                >
                  {tab === 'Details' ? '👤 Details' : tab === 'Address' ? '📍 Address' : tab === 'Others' ? '⚙️ Others' : '📄 Documents'}
                </button>
              ))}
            </div>
            <form onSubmit={handleAddSubmit} className="dms-modal-body">
              <fieldset disabled={isViewMode} style={{ border: 'none', padding: 0, margin: 0 }}>
              {activeModalTab === 'Details' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 1rem' }}>
                  <div className="input-group">
                    <label>Student Name *</label>
                    <input required type="text" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Email</label>
                    <input type="email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
                  </div>
                  <div className="input-group">
                    <label>Submission Date</label>
                    <input type="date" />
                  </div>
                  <div className="input-group">
                    <label>Residential Status</label>
                    <select value={newStudent.residential} onChange={e => setNewStudent({...newStudent, residential: e.target.value})}>
                      <option value="">Select Status</option>
                      <option value="UK Resident">UK Resident</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Session</label>
                    <select value={newStudent.session} onChange={e => setNewStudent({...newStudent, session: e.target.value})}>
                      <option value="">Select</option>
                      <option value="2026 June">2026 June</option>
                      <option value="2026 Sep">2026 Sep</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Date of Birth</label>
                    <input type="date" />
                  </div>
                  <div className="input-group">
                    <label>Recruiter</label>
                    <select value={newStudent.recruiter} onChange={e => setNewStudent({...newStudent, recruiter: e.target.value})}>
                      <option value="">Select</option>
                      {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Chaser</label>
                    <select value={newStudent.chaser} onChange={e => setNewStudent({...newStudent, chaser: e.target.value})}>
                      <option value="">Select</option>
                      {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Agent</label>
                    <select value={newStudent.agent} onChange={e => setNewStudent({...newStudent, agent: e.target.value})}>
                      <option value="">Select</option>
                      <option value="Direct">Direct</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Company</label>
                    <select value={newStudent.refCompany} onChange={e => setNewStudent({...newStudent, refCompany: e.target.value})}>
                      <option value="">Select</option>
                      <option value="Company A">Company A</option>
                    </select>
                  </div>
                </div>
              )}

              {activeModalTab === 'Address' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1.5rem 1rem' }}>
                  <div className="input-group" style={{ gridColumn: 'span 4' }}>
                    <label>Address</label>
                    <input type="text" />
                  </div>
                  <div className="input-group">
                    <label>City</label>
                    <input type="text" />
                  </div>
                  <div className="input-group">
                    <label>State</label>
                    <input type="text" />
                  </div>
                  <div className="input-group">
                    <label>Zipcode</label>
                    <input type="text" />
                  </div>
                  <div className="input-group">
                    <label>Country</label>
                    <input type="text" />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 1' }}>
                    <label>NI Number</label>
                    <input type="text" />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label>Mobile</label>
                    <input type="text" value={newStudent.mobile} onChange={e => setNewStudent({...newStudent, mobile: e.target.value})} />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 1' }}>
                    <label>Emergency Contact</label>
                    <input type="text" />
                  </div>
                </div>
              )}

              {activeModalTab === 'Others' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem 1rem' }}>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label>Course Interest</label>
                    <textarea rows="2" style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', padding: '0.5rem' }}></textarea>
                  </div>
                  <div className="input-group">
                    <label>Course & Campus 1</label>
                    <select value={newStudent.courseAndCampus1} onChange={e => setNewStudent({...newStudent, courseAndCampus1: e.target.value})}>
                      <option value="">Select</option>
                      <option value="Course 1">Course 1</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Application Status</label>
                    <select value={newStudent.appStatus || ''} onChange={e => setNewStudent({...newStudent, appStatus: e.target.value})}>
                      <option value="Awaiting submission">Awaiting submission</option>
                      <option value="Submission ongoing">Submission ongoing</option>
                      <option value="Submitted">Submitted</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Branch Email</label>
                    <input type="email" />
                  </div>
                  <div className="input-group">
                    <label>Main Branch Email</label>
                    <input type="email" />
                  </div>
                  <div className="input-group">
                    <label>Sources</label>
                    <select value={newStudent.source} onChange={e => setNewStudent({...newStudent, source: e.target.value})}>
                      <option value="manual entry">manual entry</option>
                      <option value="FB Leads">FB Leads</option>
                      <option value="TikTok Leads">TikTok Leads</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Referral</label>
                    <input type="text" />
                  </div>
                  <div className="input-group">
                    <label>Request Status</label>
                    <input type="text" defaultValue="Working" />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <label>Message</label>
                    <textarea rows="2" style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', padding: '0.5rem' }}></textarea>
                  </div>
                </div>
              )}

              {activeModalTab === 'Documents' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  {['CV', 'Passport', 'Sharecode', 'National ID', 'PS', 'HMRC', 'Travel Document', 'QA', 'Payslips', 'POA', 'P45', 'P60', 'Selfie', 'Academic Cert', 'Level 3 (60 Credits)', 'Level 3 (120 Credits)', 'Level 5 Diploma', 'Bachelor\'s Degree', 'HSC Certificate', 'SSC Certificate', 'HSC Marksheet', 'SSC Marksheet', 'English Test', 'SOP', 'Others 1', 'Others 2', 'Others 3'].map(doc => (
                    <div className="input-group" key={doc}>
                      <label>{doc}</label>
                      <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                        <button type="button" style={{ background: 'var(--bg-surface-hover)', padding: '0.4rem 0.8rem', border: 'none', borderRight: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}>Choose File</button>
                        <span style={{ padding: '0.4rem 0.8rem', color: 'var(--text-secondary)', fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>No file chosen</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ gridColumn: 'span 3', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Max 25MB per file</div>
                </div>
              )}
              </fieldset>

              {isViewMode ? (
                <div className="dms-modal-footer">
                  <button type="button" className="dms-btn-cancel" onClick={() => setShowAddModal(false)}>Close</button>
                </div>
              ) : (
                <div className="dms-modal-footer">
                  <button type="button" className="dms-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="dms-btn-save">Save Student</button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {chaserModal.show && (
        <div className="dms-modal-overlay">
          <div className="dms-modal" style={{ maxWidth: chaserModal.readOnly ? '600px' : '400px' }}>
            <div className="dms-modal-header">
              <h3>{chaserModal.readOnly ? 'Team Assignment Report' : 'Assign Chasers'}</h3>
              <button onClick={() => setChaserModal({ show: false, student: null, readOnly: false })}>✗</button>
            </div>
            
            {chaserModal.readOnly ? (
              <div className="dms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Assigned personnel for <strong>{chaserModal.student.name}</strong></p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {[
                    { role: 'CV Chaser', name: chaserModal.student.chasers?.cv, icon: '📄', color: '#3b82f6' },
                    { role: 'PS Chaser', name: chaserModal.student.chasers?.ps, icon: '📝', color: '#8b5cf6' },
                    { role: 'Submission Chaser', name: chaserModal.student.chasers?.sub, icon: '📤', color: '#f59e0b' },
                    { role: 'QA Chaser', name: chaserModal.student.chasers?.qa, icon: '✅', color: '#10b981' }
                  ].map((item, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${item.color}40`, borderRadius: '8px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontSize: '2rem', background: `${item.color}20`, padding: '0.5rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.role}</div>
                        <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '4px', fontSize: '1.1rem' }}>{item.name || 'Unassigned'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="dms-modal-footer" style={{ marginTop: '0.5rem' }}>
                  <button type="button" className="dms-btn-save" onClick={() => setChaserModal({ show: false, student: null, readOnly: false })} style={{ width: '100%', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}>
                    Close Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="dms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label>CV Chaser</label>
                  <select value={chaserModal.student.chasers?.cv || ''} onChange={(e) => handleChaserChange('cv', e.target.value)}>
                    <option value="">Select Person</option>
                    {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>PS Chaser</label>
                  <select value={chaserModal.student.chasers?.ps || ''} onChange={(e) => handleChaserChange('ps', e.target.value)}>
                    <option value="">Select Person</option>
                    {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Submission Chaser</label>
                  <select value={chaserModal.student.chasers?.sub || ''} onChange={(e) => handleChaserChange('sub', e.target.value)}>
                    <option value="">Select Person</option>
                    {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>QA Chaser</label>
                  <select value={chaserModal.student.chasers?.qa || ''} onChange={(e) => handleChaserChange('qa', e.target.value)}>
                    <option value="">Select Person</option>
                    {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div className="dms-modal-footer" style={{ marginTop: '1rem' }}>
                  <button type="button" className="dms-btn-save" onClick={handleChaserDone} style={{ width: '100%' }}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {bookingModal.show && (
        <div className="dms-modal-overlay">
          <div className="dms-modal" style={{ maxWidth: '500px' }}>
            <div className="dms-modal-header">
              <h3>Book Interview</h3>
              <button onClick={() => setBookingModal({...bookingModal, show: false})}>✗</button>
            </div>
            <form onSubmit={handleBookSubmit} className="dms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-group">
                <label>Student Name</label>
                <input type="text" value={bookingModal.student.name} disabled />
              </div>
              <div className="input-group">
                <label>Date (YYYY-MM-DD) *</label>
                <input type="date" required value={bookingModal.date} onChange={e => setBookingModal({...bookingModal, date: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Time *</label>
                <input type="time" required value={bookingModal.time} onChange={e => setBookingModal({...bookingModal, time: e.target.value})} />
              </div>
              <div className="input-group">
                <label>Campus</label>
                <input type="text" value={bookingModal.campus} onChange={e => setBookingModal({...bookingModal, campus: e.target.value})} placeholder="e.g. Main Campus" />
              </div>
              <div className="input-group">
                <label>Notes</label>
                <textarea rows="3" value={bookingModal.notes} onChange={e => setBookingModal({...bookingModal, notes: e.target.value})} style={{ background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.6rem', color: 'var(--text-primary)' }}></textarea>
              </div>
              <div className="dms-modal-footer">
                <button type="button" className="dms-btn-cancel" onClick={() => setBookingModal({...bookingModal, show: false})}>Cancel</button>
                <button type="submit" className="dms-btn-save" style={{ background: '#34d399' }}>Confirm Booking</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsDMS;
