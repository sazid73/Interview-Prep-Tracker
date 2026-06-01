import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const defaultCollegeCourses = {
  "Arden": ["BA (Hons) Business Management", "BA (Hons) Business Management with Foundation Year", "BA (Hons) Business Management (Top-Up)", "BSc (Hons) Accounting and Finance", "BSc (Hons) Accounting and Finance with Foundation Year", "BSc (Hons) Computing", "BSc (Hons) Computing with Foundation Year", "BSc (Hons) Computing (Top-Up)", "BSc (Hons) Health and Care Management", "BSc (Hons) Health and Care Management with Foundation Year", "BSc (Hons) Health and Care Management (Top-Up)", "BSc (Hons) Project Management", "BSc (Hons) Project Management with Foundation Year", "BSc (Hons) Digital Marketing", "BSc (Hons) Digital Marketing with Foundation Year", "BSc (Hons) International Hospitality and Tourism Management", "BSc (Hons) International Hospitality and Tourism Management with Foundation Year", "BSc (Hons) Psychology", "BSc (Hons) Psychology with Foundation Year", "BSc (Hons) Psychology with Counselling", "BSc (Hons) Psychology with Counselling with Foundation Year", "BA (Hons) Criminology and Psychology", "BA (Hons) Criminology and Psychology with Foundation Year", "BSc (Hons) Criminology", "LLB (Hons) Law", "LLB (Hons) Law with Foundation Year", "FdA Business and Innovation", "FdSc Computing and Digital Futures", "FdSc Health and Care Management", "Master of Public Health (MPH)", "MSc International Business Management", "MSc Project Management", "MSc Data Science", "MSc Cyber Security", "MBA"],
  "LCCA": ["BA (Hons) Business Management and Entrepreneurship", "BA (Hons) Fashion", "BA (Hons) Fashion Management and Marketing", "BA (Hons) Graphic Design", "BA (Hons) Hospitality Management and Leadership", "BA (Hons) Computer Games Art", "BA (Hons) Computer Games Design", "Foundation Degree (FdA) Applied Business Management", "Foundation Degree (FdA) Hospitality and Event Management"],
  "GBS": ["BSc (Hons) Construction Management with Foundation Year", "BA (Hons) Business & Management (Level 6 Top-Up)", "MSc Global Business", "BSc (Hons) Computing with Foundation Year", "BSc (Hons) Project Management with Foundation Year", "BSc (Hons) Applied Business Psychology with Foundation Year", "BSc (Hons) Construction Management (Level 6 Top-Up)", "MSc Project Management", "MSc Counselling & Psychotherapy", "BSc (Hons) Psychology with Counselling with Foundation Year", "BSc (Hons) Business and Tourism Management", "BSc (Hons) Accounting and Financial Management", "BSc (Hons) Health, Wellbeing and Social Care with Foundation Year", "BA (Hons) Global Business and Entrepreneurship with Foundation Year", "BSc (Hons) Health, Wellbeing and Social Care (Level 6 Direct Entry)", "HND in Business", "HND in Digital Technologies (Cyber Security)", "HND Business (Level 5 Direct Entry)", "HND in Health Care Practice", "HND in Health Care Practice (Level 5 Direct Entry)", "BA (Hons) Global Business (Business Management) with Foundation", "BA (Hons) Global Business (Business Management) (Level 4 Direct Entry)"],
  "OLC": ["Cert HE Business Management with Foundation Year", "Cert HE Business Management", "FdA Business Management", "BA (Hons) Business Management Top-Up", "Cert HE Integrated Health, Social Care & Wellbeing with Foundation Year", "Cert HE Integrated Health, Social Care & Wellbeing", "FdA Integrated Health, Social Care & Wellbeing", "BA (Hons) Integrated Health, Social Care & Wellbeing Top-Up", "BSc (Hons) Computing Top-Up"],
  "LSC": ["CertHE Business with Foundation Year", "CertHE Health and Social Care with Foundation Year", "CertHE Public Health with Foundation Year", "CertHE Public Health (Level 4)"],
  "QA": ["Cert HE Business Management", "BA Business Management", "BSc (Hons) Construction Management with Foundation Year", "BSc Health and Social Care", "BSc Health and Social Care with Foundation Year", "MSc International Business Management", "BSc (Hons) Data Science with Foundation Year", "BSc Business Management", "FdSc Business Management", "BSc Computer Science", "BSc Computer Science with Foundation Year", "BSc Cyber Security", "BSc Cyber Security with Foundation Year", "BSc Psychology", "BSc Psychology with Foundation Year"],
  "CECOS": ["Business Management and Sustainability", "BSc Health and Social Care", "BA Top-Up", "MBA", "Foundation Degree in Business", "Foundation Degree in Business with Human Resource Management", "BSc Business Management with Foundation", "BSc Health and Social Care with Foundation"],
  "UKMC": ["BSc (Hons) Health & Social Care with Foundation Year", "BA (Hons) Business Management with Foundation Year", "BA (Hons) Digital Marketing Management with Foundation Year"],
  "VCAD": [], "Arden Sky": [], "Arden BBSL": [], "Arden GVA": [], "QA-Solent/Lmet": [], "William College": []
};

const CourseAndCampus = ({ currentUserRole, currentUser }) => {
  const [collegeCourses, setCollegeCourses] = useState(defaultCollegeCourses);
  const [collegeResponsible, setCollegeResponsible] = useState({});
  const [users, setUsers] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState('GBS');
  const [newCourseInput, setNewCourseInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [responsibleInput, setResponsibleInput] = useState('');

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';

  useEffect(() => {
    fetch(`${API_BASE}/api/grid`)
      .then(res => res.json())
      .then(data => {
         const courseConfig = data['COLLEGE_COURSES'];
         if (courseConfig && courseConfig.slots && courseConfig.slots[0] && courseConfig.slots[0].text) {
           setCollegeCourses(JSON.parse(courseConfig.slots[0].text));
         }
         const respConfig = data['COLLEGE_RESPONSIBLE'];
         if (respConfig && respConfig.slots && respConfig.slots[0] && respConfig.slots[0].text) {
           setCollegeResponsible(JSON.parse(respConfig.slots[0].text));
         }
      })
      .catch(e => console.error("Failed to load college config", e));
      
      fetch(`${API_BASE}/api/users`)
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(e => console.error(e));
  }, []);

  useEffect(() => {
    setResponsibleInput(collegeResponsible[selectedCollege] || '');
  }, [selectedCollege, collegeResponsible]);

  const handleResponsibleChange = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    const updatedResp = { ...collegeResponsible, [selectedCollege]: responsibleInput.trim() };
    setCollegeResponsible(updatedResp);
    
    try {
      await fetch(`${API_BASE}/api/grid/COLLEGE_RESPONSIBLE`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: '', textColor: '', slots: [{ text: JSON.stringify(updatedResp) }] })
      });
      // Log activity
      fetch(`${API_BASE}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: new Date().toLocaleString(), user: currentUser || 'Unknown', action: 'Admin Settings', details: `Changed responsible user for ${selectedCollege}` })
      }).catch(e => console.error(e));
    } catch (err) {
      console.error(err);
      alert('Failed to save responsible user to server.');
    }
  };

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseInput.trim() || !isAdmin) return;
    
    setIsSaving(true);
    const updatedCourses = { 
      ...collegeCourses, 
      [selectedCollege]: [...(collegeCourses[selectedCollege] || []), newCourseInput.trim()] 
    };
    
    setCollegeCourses(updatedCourses);
    setNewCourseInput('');
    
    try {
      await fetch(`${API_BASE}/api/grid/COLLEGE_COURSES`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: '', textColor: '', slots: [{ text: JSON.stringify(updatedCourses) }] })
      });
      
      // Log activity
      fetch(`${API_BASE}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: new Date().toLocaleString(), user: currentUser || 'Unknown', action: 'Admin Settings', details: `Added new course "${newCourseInput}" to ${selectedCollege}` })
      }).catch(e => console.error(e));
      
    } catch (err) {
      console.error(err);
      alert('Failed to save course to server.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentList = collegeCourses[selectedCollege] || [];

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Course and Campus Management</h2>
        <p style={{ color: 'var(--text-secondary)' }}>View and manage the official list of subjects offered by each university campus.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        {/* Sidebar: College List */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: 'fit-content' }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>Campuses</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {Object.keys(collegeCourses).sort().map(college => (
              <li key={college}>
                <button
                  onClick={() => setSelectedCollege(college)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.8rem 1rem',
                    background: selectedCollege === college ? '#3b82f6' : 'transparent',
                    color: selectedCollege === college ? '#fff' : 'var(--text-primary)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: selectedCollege === college ? 'bold' : 'normal',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  {college}
                  <span style={{ fontSize: '0.8rem', background: selectedCollege === college ? 'rgba(255,255,255,0.2)' : 'var(--bg-color)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    {(collegeCourses[college] || []).length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content: Subjects List & Add Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {isAdmin ? (
              <div style={{ flex: 2, background: 'var(--bg-surface-hover)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem' }}>+ Add New Subject</h3>
                <form onSubmit={handleAddCourse} style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    type="text" 
                    value={newCourseInput}
                    onChange={e => setNewCourseInput(e.target.value)}
                    placeholder={`e.g. BSc (Hons) Computer Science`}
                    required
                    style={{ flex: 1, padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '1rem' }}
                  />
                  <button 
                    type="submit"
                    disabled={isSaving}
                    style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0 2rem', borderRadius: '6px', fontWeight: 'bold', cursor: isSaving ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
                  >
                    {isSaving ? 'Saving...' : 'Add'}
                  </button>
                </form>
              </div>
            ) : (
              <div style={{ flex: 2, background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🔒</span> You are viewing in read-only mode. Only administrators can add new subjects.
              </div>
            )}
            
            <div style={{ flex: 1, background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem' }}>College Responsible</h3>
              <form onSubmit={handleResponsibleChange} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text"
                  value={responsibleInput}
                  onChange={(e) => setResponsibleInput(e.target.value)}
                  disabled={!isAdmin}
                  placeholder="e.g. John Doe"
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '1rem' }}
                />
                {isAdmin && (
                  <button type="submit" style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0 1rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Save
                  </button>
                )}
              </form>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', flex: 1 }}>
            <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📚 {selectedCollege} - Authorized Subjects
            </h3>
            
            {currentList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                No subjects have been mapped to this campus yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                {currentList.map((course, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%' }}></div>
                    {course}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default CourseAndCampus;
