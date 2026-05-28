import React, { useState, useEffect } from 'react';
import './StudentsDMS.css';

const API_BASE = import.meta.env.VITE_API_URL || '';

const StudentsDMS = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '', email: '', mobile: '', source: 'manual entry', session: '', courseAndCampus1: ''
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/students`)
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error(err));
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      const data = await res.json();
      if (data.success) {
        setStudents([data.student, ...students]);
        setShowAddModal(false);
        setNewStudent({ name: '', email: '', mobile: '', source: 'manual entry', session: '', courseAndCampus1: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (s.studentId && s.studentId.includes(searchTerm))
  );

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
          <select className="dms-rows-select">
            <option>10</option>
            <option>25</option>
            <option>50</option>
          </select>
        </div>
        <div className="dms-toolbar-right">
          <button className="dms-btn-filter">⧨ Filters</button>
          <button className="dms-btn-add" onClick={() => setShowAddModal(true)}>+ Add Student</button>
        </div>
      </div>

      <div className="dms-table-wrapper">
        <table className="dms-table">
          <thead>
            <tr>
              <th><input type="checkbox" /></th>
              <th>#</th>
              <th>SOURCES</th>
              <th>CREATED</th>
              <th>MODIFIED</th>
              <th>SESSION</th>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>MOBILE</th>
              <th>COURSE & CAMPUS 1</th>
              <th>COURSE & CAMPUS 2</th>
              <th>REF. COMPANY</th>
              <th>INT</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="13" style={{ textAlign: 'center', padding: '2rem' }}>No records found.</td>
              </tr>
            )}
            {filteredStudents.map((student, idx) => (
              <tr key={student._id || idx} className={student.statusType === 'red' ? 'row-red' : ''}>
                <td><input type="checkbox" /></td>
                <td className="id-col">{student.studentId}</td>
                <td>{student.source}</td>
                <td>{student.createdAt}</td>
                <td>{student.modifiedAt}</td>
                <td><span className={student.session ? "session-badge" : ""}>{student.session}</span></td>
                <td className="name-col">{student.name}</td>
                <td><a href={`mailto:${student.email}`} className="email-link">{student.email || '—'}</a></td>
                <td>{student.mobile || '—'}</td>
                <td>{student.courseAndCampus1 || '—'}</td>
                <td>{student.courseAndCampus2 || '—'}</td>
                <td>{student.refCompany || '—'}</td>
                <td><span className="int-badge">Int</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dms-pagination">
        <div className="pagination-info">
          Showing 1 to {Math.min(filteredStudents.length, 10)} of {filteredStudents.length} entries
        </div>
        <div className="pagination-controls">
          <button className="page-btn disabled">{"<"}</button>
          <button className="page-btn active">1</button>
          <button className="page-btn">2</button>
          <span className="page-dots">...</span>
          <button className="page-btn">845</button>
          <button className="page-btn">{">"}</button>
        </div>
        <div className="pagination-jump">
          <input type="text" placeholder="Enter page" />
          <button>Go</button>
        </div>
      </div>

      {showAddModal && (
        <div className="dms-modal-overlay">
          <div className="dms-modal">
            <div className="dms-modal-header">
              <h3>Add New Student</h3>
              <button onClick={() => setShowAddModal(false)}>✗</button>
            </div>
            <form onSubmit={handleAddSubmit} className="dms-modal-body">
              <input required type="text" placeholder="Full Name" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
              <input type="email" placeholder="Email" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
              <input type="text" placeholder="Mobile" value={newStudent.mobile} onChange={e => setNewStudent({...newStudent, mobile: e.target.value})} />
              <select value={newStudent.source} onChange={e => setNewStudent({...newStudent, source: e.target.value})}>
                <option value="manual entry">Manual Entry</option>
                <option value="FB Leads">FB Leads</option>
                <option value="TikTok Leads">TikTok Leads</option>
                <option value="QR">QR</option>
              </select>
              <input type="text" placeholder="Session (e.g. 2026 June)" value={newStudent.session} onChange={e => setNewStudent({...newStudent, session: e.target.value})} />
              <input type="text" placeholder="Course & Campus 1" value={newStudent.courseAndCampus1} onChange={e => setNewStudent({...newStudent, courseAndCampus1: e.target.value})} />
              <div className="dms-modal-footer">
                <button type="button" className="dms-btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="dms-btn-save">Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsDMS;
