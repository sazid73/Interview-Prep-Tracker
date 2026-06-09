import SearchableSelect from './SearchableSelect';
import React, { useState, useEffect, useRef } from 'react';
import './StudentsDMS.css';
import './StudentsDMS_colors.css';
import { defaultColumnsConfig } from './ColumnManager';

const API_BASE = import.meta.env.VITE_API_URL || '';

const StudentsDMS = ({ setCurrentView, currentUser, currentUserRole, currentUserData }) => {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [jumpPage, setJumpPage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('Details');
  const [editingCell, setEditingCell] = useState({ id: null, field: null });
  const [editingValue, setEditingValue] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [routeModal, setRouteModal] = useState({ show: false, student: null });
  const [chaserModal, setChaserModal] = useState({ show: false, student: null, readOnly: false });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({});
  const [activeCollegeTab, setActiveCollegeTab] = useState('All Students');
  const [tableColumns, setTableColumns] = useState(defaultColumnsConfig);
  const [targetsList, setTargetsList] = useState([]);
  const fileInputRef = useRef(null);
  
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

  const [collegeCourses, setCollegeCourses] = useState(defaultCollegeCourses);
  const [collegeResponsible, setCollegeResponsible] = useState({});
  const [appStatuses, setAppStatuses] = useState([
    "Assign for submission", "Submission ongoing", "Urgent Submission", "Submitted"
  ]);
  const [intStatuses, setIntStatuses] = useState([
    "Interested and Responding", "Declined", "Prep Done", "Offer Sent", "SFE Not Approved",
    "On Hold - Check Later (AN)", "SFE Approved - Process Next Steps", "On Holiday (AN)",
    "Awaiting Further Entry Criteria Docs/Info (AN)", "Awaiting Necessary Pretask For Act Int",
    "DNC (AN)", "File Withdrawn (AN)", "File Declined (AN)", "Fully Enrolled 3rd Year",
    "Fully Enrolled 2nd Year", "Awaiting Interview Result", "Awaiting Prep",
    "Interview Passed - Proceed Next Steps", "Interested - Awaiting Docs", "Interested - Call Back Later",
    "Failed - Try Within Time-frame/Process Elsewhere", "SFE Submitted - Awaiting Approval",
    "Awaiting Submission", "At Risk Of Cancelation", "No Longer Interested",
    "Interested - Not Responding", "Interested - Further Info Required", "New Application",
    "Direct", "Fully Enrolled", "Awaiting Induction", "Awaiting Transfer", "Awaiting SFE",
    "Awaiting QC", "Awaiting Offer Letter", "Awaiting Actual Interview", "Not eligible - Check Later",
    "Received 3rd Payment", "Received 2nd Payment", "Received 1st payment", "Not Progressed To 3rd Year",
    "Not Progressed to 2nd Year", "Did not received 3rd Payment", "Did not received 2nd payment",
    "Did Not Received First Payment", "Deferred", "On holiday - Please follow up later", "QC done"
  ]);
  const [sfeStatuses, setSfeStatuses] = useState([
    "Assign for SFE", "Urgent SFE", "SFE ongoing", "SFE submitted", "SFE approved", "SFE Rejected", "Ineligible for SFE"
  ]);
  const [sessions, setSessions] = useState([
    "2026 June", "2026 Sep"
  ]);
  const [showCourseSettings, setShowCourseSettings] = useState(false);
  const [newCourseInput, setNewCourseInput] = useState('');
  const [selectedConfigCollege, setSelectedConfigCollege] = useState('GBS');
  
  const collegeTabs = [
    'All Students', 'GBS', 'VCAD', 'LCCA', 'CECOS', 'Arden', 'QA-Solent/Lmet', 'OLC', 'William College', 'UKMC', 'LSC'
  ];

  const getTabStyle = (tab) => {
    switch (tab) {
      case 'GBS': return { bg: '#f59e0b', text: '#000', tabText: '#fff' }; // orange
      case 'QA-Solent/Lmet': return { bg: '#bbf7d0', text: '#000', tabText: '#064e3b' }; // light green
      case 'LSC': return { bg: '#c4b5fd', text: '#000', tabText: '#000' }; // light purple
      case 'VCAD': return { bg: '#fbcfe8', text: '#000', tabText: '#000' }; // pink
      case 'LCCA': return { bg: '#fde68a', text: '#000', tabText: '#000' }; // yellow
      case 'CECOS': return { bg: '#bfdbfe', text: '#000', tabText: '#000' }; // light blue
      case 'Arden': return { bg: '#fca5a5', text: '#000', tabText: '#000' }; // red
      case 'OLC': return { bg: '#99f6e4', text: '#000', tabText: '#000' }; // teal
      case 'William College': return { bg: '#fed7aa', text: '#000', tabText: '#000' }; // orange
      case 'UKMC': return { bg: '#ddd6fe', text: '#000', tabText: '#000' }; // purple
      default: return { bg: 'var(--bg-surface)', text: 'var(--text-primary)', tabText: '#fff' }; // default
    }
  };
  const initialStudentState = {
    name: '', email: '', mobile: '', source: 'manual entry', session: '', 
    courseAndCampus1: '', courseAndCampus2: '', route: '', routeNotes: '', routeCompany: '', routeJobRole: '', routeQualification: '', routeCredits: '', routeProvider: '', routeWorkType: '', routeEduType: '', routeWorkVerification: false, routeEduOrdered: false, routeEduReceived: false, routeHistory: [], 
    intStatus: 'Interested and Responding', intStatusHistory: [],
    recruiter: '', recruiterHistory: [], 
    chaser: 'Click to assign', chaserHistory: [], 
    agent: '', residential: '', location: '', appId: '',
    appStatus: 'Awaiting submission', appStatusHistory: [],
    sfeStatus: 'Assign for SFE', sfeStatusHistory: [],
    clTime: '', submit: '', docs: '0'
  };
  const [newStudent, setNewStudent] = useState(initialStudentState);
  const [isViewMode, setIsViewMode] = useState(false);
  const [bookingModal, setBookingModal] = useState({ show: false, student: null, date: '', time: '10:00', campus: '', notes: '' });
  const [notesModal, setNotesModal] = useState({ show: false, student: null, fieldType: null, note: '' });
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showOrderedOnly, setShowOrderedOnly] = useState(false);
  const [showReceivedOnly, setShowReceivedOnly] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/students`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setStudents(data))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/users`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/targets`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setTargetsList(data))
      .catch(err => console.error(err));

    fetch(`${API_BASE}/api/grid`, { cache: 'no-store' })
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
         const appConfig = data['APP_STATUSES'];
         if (appConfig && appConfig.slots[0]) setAppStatuses(JSON.parse(appConfig.slots[0].text));
         
         const intConfig = data['INT_STATUSES'];
         if (intConfig && intConfig.slots[0]) setIntStatuses(JSON.parse(intConfig.slots[0].text));
         
         const sfeConfig = data['SFE_STATUSES'];
         if (sfeConfig && sfeConfig.slots[0]) setSfeStatuses(JSON.parse(sfeConfig.slots[0].text));
 
         const sessionConfig = data['SESSIONS_CONFIG'];
         if (sessionConfig && sessionConfig.slots[0]) setSessions(JSON.parse(sessionConfig.slots[0].text));
         
         const colConfig = data['DMS_COLUMNS_CONFIG'];
         if (colConfig && colConfig.slots && colConfig.slots[0] && colConfig.slots[0].text) {
           setTableColumns(JSON.parse(colConfig.slots[0].text));
         }
      })
      .catch(e => console.error(e));
  }, []);

  const logActivity = (action, details) => {
    fetch(`${API_BASE}/api/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp: new Date().toLocaleString(), user: currentUser || 'Unknown', action, details })
    }).catch(e => console.error(e));
  };

  const renderRouteCell = (student) => {
    if (!student.route) return <span style={{ color: '#9ca3af' }}>Select Route</span>;
    
    const showWork = student.route === 'Work our' || student.route === 'Work own' || student.route === 'Work + Edu';
    const showEdu = student.route === 'Edu our' || student.route === 'Edu Own' || student.route === 'Work + Edu';

    return (
      <div>
        <strong style={{ color: 'var(--accent-color)' }}>{student.route}</strong>
        {showWork && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {student.routeCompany && <span>🏢 {student.routeCompany} </span>}
            {student.routeJobRole && <span>💼 {student.routeJobRole}</span>}
            {student.routeWorkVerification && <div style={{ background: '#10b981', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'block', marginTop: '0.4rem', fontSize: '0.7rem', fontWeight: 'bold', width: 'fit-content' }}>✓ Verified</div>}
          </div>
        )}
        {showEdu && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {student.routeQualification && <span>🎓 {student.routeQualification} </span>}
            {student.routeCredits && <span>(Credits: {student.routeCredits})</span>}
            {student.routeProvider && <div>🏫 {student.routeProvider}</div>}
            {student.routeEduOrdered && <div style={{ background: '#3b82f6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'block', marginTop: '0.4rem', fontSize: '0.7rem', fontWeight: 'bold', width: 'fit-content' }}>✓ Ordered</div>}
            {student.routeEduReceived && <div style={{ background: '#8b5cf6', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px', display: 'block', marginTop: '0.4rem', fontSize: '0.7rem', fontWeight: 'bold', width: 'fit-content' }}>✓ Received</div>}
          </div>
        )}
      </div>
    );
  };

  const createRouteHistoryEntry = (s) => ({
    route: s.route, routeNotes: s.routeNotes, routeCompany: s.routeCompany,
    routeJobRole: s.routeJobRole, routeQualification: s.routeQualification,
    routeCredits: s.routeCredits, routeProvider: s.routeProvider,
    routeWorkType: s.routeWorkType, routeEduType: s.routeEduType,
    routeWorkVerification: s.routeWorkVerification,
    timestamp: new Date().toLocaleString(),
    user: currentUser || 'Unknown'
  });

  const createGenericHistoryEntry = (value, note, fieldType) => ({
    [fieldType === 'recruiter' || fieldType === 'chaser' ? 'assignee' : 'status']: value,
    note: note,
    timestamp: new Date().toLocaleString(),
    user: currentUser || 'Unknown'
  });

  const handleNotesModalSave = async () => {
    let student = { ...notesModal.student };
    const historyField = `${notesModal.fieldType}History`;
    
    // Determine the new value: for intStatus it comes from notesModal.newValue
    const newValue = notesModal.newValue !== undefined ? notesModal.newValue : student[notesModal.fieldType];
    const previousValue = student[notesModal.fieldType];
    
    // Update the field value if it changed (or for intStatus, always apply newValue)
    student[notesModal.fieldType] = newValue;
    
    // Create history entry
    const historyEntry = createGenericHistoryEntry(newValue, notesModal.note, notesModal.fieldType);
    student[historyField] = [...(student[historyField] || []), historyEntry];
    
    setStudents(students.map(s => s._id === student._id ? student : s));
    setNotesModal({ show: false, student: null, fieldType: null, note: '', newValue: undefined });
    
    try {
      await fetch(`${API_BASE}/api/students/${student._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          [notesModal.fieldType]: student[notesModal.fieldType],
          [historyField]: student[historyField] 
        })
      });
      logActivity('Notes Add/Update', `Updated ${notesModal.fieldType} and added a note for ${student.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  const renderRouteFields = (studentState, setStudentState) => (
    <>
      <div className="input-group">
        <label>Route</label>
        <SearchableSelect value={studentState.route || ''} onChange={(e) => setStudentState({ ...studentState, route: e.target.value })}>
          <option value="">Select Route</option>
          <option value="Work our">Work our</option>
          <option value="Work own">Work own</option>
          <option value="Edu our">Edu our</option>
          <option value="Edu Own">Edu Own</option>
          <option value="Work + Edu">Work + Edu</option>
        </SearchableSelect>
      </div>
      
      {(studentState.route === 'Work our' || studentState.route === 'Work own' || studentState.route === 'Work + Edu') && (
        <>
          {studentState.route === 'Work + Edu' && (
            <div className="input-group">
              <label>Work Type</label>
              <SearchableSelect value={studentState.routeWorkType || ''} onChange={(e) => setStudentState({ ...studentState, routeWorkType: e.target.value })}>
                <option value="">Select Work Type</option>
                <option value="Work our">Work our</option>
                <option value="Work own">Work own</option>
              </SearchableSelect>
            </div>
          )}
          {((studentState.route === 'Work + Edu' && studentState.routeWorkType === 'Work our') || studentState.route === 'Work our') && (
            <div className="input-group">
              <label>Company</label>
              <SearchableSelect value={studentState.routeCompany || ''} onChange={(e) => setStudentState({ ...studentState, routeCompany: e.target.value })}>
                <option value="">Select Company</option>
                <option value="Green Grocery">Green Grocery</option>
                <option value="Big Discount">Big Discount</option>
              </SearchableSelect>
            </div>
          )}
          {((studentState.route === 'Work + Edu' && studentState.routeWorkType === 'Work own') || studentState.route === 'Work own') && (
            <div className="input-group">
              <label>Company Name</label>
              <input type="text" value={studentState.routeCompany || ''} onChange={(e) => setStudentState({ ...studentState, routeCompany: e.target.value })} />
            </div>
          )}
          <div className="input-group">
            <label>Job Role</label>
            <input type="text" value={studentState.routeJobRole || ''} onChange={(e) => setStudentState({ ...studentState, routeJobRole: e.target.value })} />
          </div>
          <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row', marginTop: '0.5rem' }}>
            <input 
              type="checkbox" 
              id={`work-verification-${studentState._id || 'new'}`}
              checked={studentState.routeWorkVerification || false}
              onChange={(e) => {
                if (e.target.checked) {
                  if (window.confirm("Are you sure you want to mark Work Verification as Done?")) {
                    setStudentState({ ...studentState, routeWorkVerification: true });
                  }
                } else {
                  setStudentState({ ...studentState, routeWorkVerification: false });
                }
              }}
              style={{ width: 'auto', cursor: 'pointer' }}
            />
            <label htmlFor={`work-verification-${studentState._id || 'new'}`} style={{ cursor: 'pointer', margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>Work Verification Done</label>
          </div>
        </>
      )}

      {(studentState.route === 'Edu our' || studentState.route === 'Edu Own' || studentState.route === 'Work + Edu') && (
        <>
          {studentState.route === 'Work + Edu' && (
            <div className="input-group">
              <label>Edu Type</label>
              <SearchableSelect value={studentState.routeEduType || ''} onChange={(e) => setStudentState({ ...studentState, routeEduType: e.target.value })}>
                <option value="">Select Edu Type</option>
                <option value="Edu our">Edu our</option>
                <option value="Edu Own">Edu Own</option>
              </SearchableSelect>
            </div>
          )}
          <div className="input-group">
            <label>Qualification</label>
            <input type="text" value={studentState.routeQualification || ''} onChange={(e) => setStudentState({ ...studentState, routeQualification: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Credits</label>
            <input type="text" value={studentState.routeCredits || ''} onChange={(e) => setStudentState({ ...studentState, routeCredits: e.target.value })} />
          </div>
          <div className="input-group">
            <label>Provider Name</label>
            <input type="text" value={studentState.routeProvider || ''} onChange={(e) => setStudentState({ ...studentState, routeProvider: e.target.value })} />
          </div>
          {((studentState.route === 'Edu our') || (studentState.route === 'Work + Edu' && studentState.routeEduType === 'Edu our')) && (
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row', marginTop: '0.5rem' }}>
              <input 
                type="checkbox" 
                id={`edu-ordered-${studentState._id || 'new'}`}
                checked={studentState.routeEduOrdered || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (window.confirm("Are you sure you want to mark Edu as Ordered?")) {
                      setStudentState({ ...studentState, routeEduOrdered: true });
                    }
                  } else {
                    setStudentState({ ...studentState, routeEduOrdered: false });
                  }
                }}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <label htmlFor={`edu-ordered-${studentState._id || 'new'}`} style={{ cursor: 'pointer', margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>Edu Ordered</label>
            </div>
          )}
          {((studentState.route === 'Edu Own') || (studentState.route === 'Work + Edu' && studentState.routeEduType === 'Edu Own')) && (
            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexDirection: 'row', marginTop: '0.5rem' }}>
              <input 
                type="checkbox" 
                id={`edu-received-${studentState._id || 'new'}`}
                checked={studentState.routeEduReceived || false}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (window.confirm("Are you sure you want to mark Edu as Received?")) {
                      setStudentState({ ...studentState, routeEduReceived: true });
                    }
                  } else {
                    setStudentState({ ...studentState, routeEduReceived: false });
                  }
                }}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              <label htmlFor={`edu-received-${studentState._id || 'new'}`} style={{ cursor: 'pointer', margin: 0, fontWeight: 'bold', color: 'var(--text-primary)' }}>Edu Received</label>
            </div>
          )}
        </>
      )}

      <div className="input-group" style={{ gridColumn: '1 / -1' }}>
        <label>Notes (Start year, extra details)</label>
        <textarea rows="3" value={studentState.routeNotes || ''} onChange={(e) => setStudentState({ ...studentState, routeNotes: e.target.value })} style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', padding: '0.5rem' }} />
      </div>
    </>
  );

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { read, utils } = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = utils.sheet_to_json(worksheet);

      if (json.length === 0) {
        alert("The uploaded file is empty.");
        return;
      }

      const rowsToProcess = json.slice(0, 20); // Limit to 20 students
      let successCount = 0;
      let errorCount = 0;
      
      const newStudentsList = [];

      for (const row of rowsToProcess) {
        const normalizedRow = {};
        for (const key in row) {
          normalizedRow[key.toLowerCase().trim()] = row[key];
        }

        const studentData = { ...initialStudentState };

        studentData.name = normalizedRow['name'] || normalizedRow['student name'] || normalizedRow['full name'] || '';
        studentData.email = normalizedRow['email'] || normalizedRow['email address'] || '';
        studentData.mobile = String(normalizedRow['mobile'] || normalizedRow['phone'] || normalizedRow['contact'] || '');
        studentData.session = normalizedRow['session'] || normalizedRow['intake'] || '';
        studentData.courseAndCampus1 = normalizedRow['course & campus 1'] || normalizedRow['course and campus 1'] || normalizedRow['course'] || '';
        studentData.courseAndCampus2 = normalizedRow['course & campus 2'] || normalizedRow['course and campus 2'] || normalizedRow['course 2'] || '';
        studentData.appStatus = normalizedRow['app status'] || normalizedRow['application status'] || 'Awaiting submission';
        studentData.intStatus = normalizedRow['int status'] || normalizedRow['interview status'] || 'Interested and Responding';
        studentData.recruiter = normalizedRow['recruiter'] || '';
        studentData.chaser = normalizedRow['chaser'] || 'Click to assign';
        studentData.agent = normalizedRow['agent'] || '';
        studentData.residential = normalizedRow['residential'] || normalizedRow['residential status'] || '';
        studentData.location = normalizedRow['location'] || '';
        studentData.route = normalizedRow['route'] || '';
        studentData.routeNotes = normalizedRow['route notes'] || normalizedRow['notes'] || '';
        studentData.routeCompany = normalizedRow['route company'] || normalizedRow['company'] || '';
        studentData.source = 'manual entry';

        if (!studentData.name) {
          errorCount++;
          continue; 
        }

        try {
          const res = await fetch(`${API_BASE}/api/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studentData)
          });
          const resData = await res.json();
          if (resData.success) {
            newStudentsList.push(resData.student);
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        setStudents(prev => [...newStudentsList, ...prev]);
        logActivity('Bulk Upload', `Successfully uploaded ${successCount} students via file.`);
      }
      
      alert(`Upload complete! Successfully added ${successCount} students. ${errorCount > 0 ? `Failed to add ${errorCount} students.` : ''}`);
      
    } catch (err) {
      console.error(err);
      alert("Error processing file. Please ensure it is a valid Excel or CSV file.");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteHistory = async (entryToDelete, historyType = 'routeHistory') => {
    if (!window.confirm(`Are you sure you want to delete this ${historyType.replace('History', '')} record?`)) return;
    
    const updatedHistory = (newStudent[historyType] || []).filter(entry => entry !== entryToDelete);
    const updatedStudent = { ...newStudent, [historyType]: updatedHistory };
    
    setNewStudent(updatedStudent);
    
    if (updatedStudent._id) {
      try {
        await fetch(`${API_BASE}/api/students/${updatedStudent._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedStudent)
        });
        setStudents(students.map(s => s._id === updatedStudent._id ? updatedStudent : s));
        logActivity('History Delete', `Deleted a ${historyType} record for ${updatedStudent.name}`);
      } catch (err) {
        console.error("Failed to delete history:", err);
      }
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    // Strict Course Validation
    if (newStudent.courseAndCampus1) {
      const allValidCourses = Object.entries(collegeCourses).flatMap(([c, courses]) => courses.map(course => `${c} - ${course}`));
      if (!allValidCourses.includes(newStudent.courseAndCampus1)) {
        alert("Please select a valid Course & Campus from the dropdown.");
        return;
      }
    }
    if (newStudent.courseAndCampus2) {
      const allValidCourses = Object.entries(collegeCourses).flatMap(([c, courses]) => courses.map(course => `${c} - ${course}`));
      if (!allValidCourses.includes(newStudent.courseAndCampus2)) {
        alert("Please select a valid Course & Campus 2 from the dropdown.");
        return;
      }
    }

    try {
      let studentToSave = { ...newStudent };

      if (studentToSave._id) {
        // Edit existing student
        const oldStudent = students.find(s => s._id === studentToSave._id);
        if (oldStudent && (
          oldStudent.route !== studentToSave.route || 
          oldStudent.routeNotes !== studentToSave.routeNotes || 
          oldStudent.routeCompany !== studentToSave.routeCompany ||
          oldStudent.routeJobRole !== studentToSave.routeJobRole ||
          oldStudent.routeQualification !== studentToSave.routeQualification ||
          oldStudent.routeCredits !== studentToSave.routeCredits ||
          oldStudent.routeProvider !== studentToSave.routeProvider ||
          oldStudent.routeWorkType !== studentToSave.routeWorkType ||
          oldStudent.routeEduType !== studentToSave.routeEduType ||
          oldStudent.routeWorkVerification !== studentToSave.routeWorkVerification
        )) {
          studentToSave.routeHistory = [...(studentToSave.routeHistory || []), createRouteHistoryEntry(studentToSave)];
        }

        const res = await fetch(`${API_BASE}/api/students/${studentToSave._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentToSave)
        });
        const data = await res.json();
        if (data.success) {
          setStudents(students.map(s => s._id === studentToSave._id ? data.student : s));
          setShowAddModal(false);
          setNewStudent(initialStudentState);
          logActivity('Student Edit', `Updated student details for ${studentToSave.name}`);
        }
      } else {
        // Add new student
        if (studentToSave.route) {
          studentToSave.routeHistory = [createRouteHistoryEntry(studentToSave)];
        }
        const res = await fetch(`${API_BASE}/api/students`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(studentToSave)
        });
        const data = await res.json();
        if (data.success) {
          setStudents([data.student, ...students]);
          setShowAddModal(false);
          setNewStudent(initialStudentState);
          logActivity('Student Created', `Created new student lead: ${newStudent.name}`);
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
    // Search Term
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.studentId && s.studentId.includes(searchTerm));
    
    // College Tab Filter
    const matchesCollege = activeCollegeTab === 'All Students' || 
                           (s.courseAndCampus1 && s.courseAndCampus1.startsWith(activeCollegeTab));
    
    const matchesVerified = showVerifiedOnly ? s.routeWorkVerification === true : true;
    const matchesOrdered = showOrderedOnly ? s.routeEduOrdered === true : true;
    const matchesReceived = showReceivedOnly ? s.routeEduReceived === true : true;
    
    // Dynamic Filters
    const visibleFilters = tableColumns.filter(c => c.filterable);
    const matchesFilters = visibleFilters.every(col => {
      if (!filters[col.id]) return true; // if filter is empty, it passes
      
      const filterVal = filters[col.id].toLowerCase();
      const studentVal = (s[col.id] || '').toLowerCase();
      
      if (col.filterType === 'select') {
        if (col.id === 'session' || col.id === 'appStatus' || col.id === 'intStatus' || col.id === 'sfeStatus' || col.id === 'residential') {
           return studentVal === filterVal;
        }
        return studentVal.includes(filterVal);
      }
      return studentVal.includes(filterVal);
    });

    return matchesSearch && matchesCollege && matchesVerified && matchesOrdered && matchesReceived && matchesFilters;
  });

  const uniqueRecruiters = [...new Set(students.map(s => s.recruiter).filter(Boolean))];
  const uniqueSessions = [...new Set(students.map(s => s.session).filter(Boolean))];
  const uniqueIntStatuses = [...new Set(students.map(s => s.intStatus).filter(Boolean))];
  const uniqueAgents = [...new Set(students.map(s => s.agent).filter(Boolean))];
  const uniqueChasers = [...new Set(students.map(s => s.chaser).filter(c => c && c !== 'Click to assign'))];
  const uniqueSources = [...new Set(students.map(s => s.source).filter(Boolean))];
  const uniqueResidential = [...new Set(students.map(s => s.residential).filter(Boolean))];

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

    if (field === 'courseAndCampus1' || field === 'courseAndCampus2') {
      const allValidCourses = Object.entries(collegeCourses).flatMap(([c, courses]) => courses.map(course => `${c} - ${course}`));
      if (newValue && !allValidCourses.includes(newValue)) {
        alert("Please select a valid Course & Campus from the dropdown.");
        return;
      }
    }

    const updatedStudent = { ...targetStudent, [field]: newValue };
    setStudents(students.map(s => s._id === studentId ? updatedStudent : s));

    try {
      await fetch(`${API_BASE}/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue })
      });
      logActivity('Student Edit', `Changed ${field} to "${newValue}" for ${targetStudent.name}`);
      setToastMsg('Saved successfully');
      setTimeout(() => setToastMsg(null), 3000);
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
      logActivity('Student Edit', `Assigned ${type} chaser to ${val} for ${student.name}`);
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
      logActivity('Student Edit', `Updated appStatus to ${newStatus} for ${student.name}`);
    } catch (err) {
      console.error(err);
    }
    
    setChaserModal({ show: false, student: null, readOnly: false });
  };

  const renderAppStatusCell = (student) => {
    const status = student.appStatus || 'Assign for submission';
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '1.5rem' }}>
        <span 
          className="app-status-text"
          onClick={() => setNotesModal({ show: true, student, fieldType: 'appStatus', note: '', newValue: status })} 
          onContextMenu={(e) => {
            e.preventDefault();
            if (status === 'Submission ongoing' || status === 'Submitted') {
              setChaserModal({ show: true, student, readOnly: true });
            }
          }}
          style={{ cursor: 'pointer', color: (status === 'Submitted' || status === 'Completed') ? '#34d399' : (status === 'Submission ongoing' || status === 'Awaiting submission and QC') ? '#60a5fa' : (status === 'Urgent Submission') ? '#ef4444' : '#fbbf24', fontWeight: 'bold' }}
        >
          {status}
        </span>
      </div>
    );
  };

  const renderCell = (student, field, placeholder = '—') => {
    const isEditing = editingCell.id === student._id && editingCell.field === field;
    if (isEditing) {
      const colLabel = tableColumns.find(c => c.id === field)?.label || field;
      
      const handleSave = (e) => {
        e.stopPropagation();
        handleCellEdit(student._id, field, editingValue);
      };

      const handleCancel = (e) => {
        e.stopPropagation();
        setEditingCell({ id: null, field: null });
      };

      return (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', zIndex: 9999, background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid var(--border-color)', minWidth: '250px', top: '-10px', left: '-10px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{colLabel}</div>
            
            {field === 'recruiter' || field === 'chaser' ? (
              <SearchableSelect 
                autoFocus 
                value={editingValue}
                onChange={e => setEditingValue(e.target.value)}
                style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)' }}
              >
                <option value="">Select</option>
                {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
              </SearchableSelect>
            ) : field === 'courseAndCampus1' || field === 'courseAndCampus2' ? (
              <SearchableSelect 
                autoFocus 
                value={editingValue}
                onChange={e => setEditingValue(e.target.value)}
                style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)' }}
              >
                <option value="">Search...</option>
                {Object.entries(collegeCourses).flatMap(([c, courses]) => courses.map(course => (
                   <option key={`${c} - ${course}`} value={`${c} - ${course}`}>{c} - {course}</option>
                )))}
              </SearchableSelect>
            ) : (
              <input 
                autoFocus
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave(e)}
                style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)', borderRadius: '6px' }}
              />
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button 
                onClick={handleSave}
                style={{ flex: 1, background: '#4f46e5', color: '#fff', border: 'none', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                ✓
              </button>
              <button 
                onClick={handleCancel}
                style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.5rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                ×
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    if (field === 'recruiter' || field === 'chaser') {
      const isAssigned = student[field] && student[field] !== 'Click to assign';
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '1.5rem' }}>
          <span 
            onClick={() => { setEditingCell({ id: student._id, field }); setEditingValue(student[field] || ''); }} 
            style={{ cursor: 'pointer', flex: 1, color: field==='chaser' && (!student[field] || student[field]==='Click to assign') ? '#9ca3af' : 'inherit' }}
          >
            {student[field] || placeholder}
          </span>
          {isAssigned && (
            <button 
              title="Notes History" 
              onClick={(e) => { e.stopPropagation(); setNotesModal({ show: true, student, fieldType: field, note: '' }); }} 
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: '0' }}
            >
              📝
            </button>
          )}
        </div>
      );
    }

    return <span onClick={() => { setEditingCell({ id: student._id, field }); setEditingValue(student[field] || ''); }} style={{ cursor: 'text', display: 'block', minHeight: '1.5rem' }}>{student[field] || placeholder}</span>;
  };

  const renderTableCell = (student, col) => {
    switch (col.id) {
      case 'checkbox': return <input type="checkbox" />;
      case 'studentId': return <span className="id-col">{student.studentId}</span>;
      case 'createdAt': return student.createdAt;
      case 'modifiedAt': return student.modifiedAt;
      case 'session': return <span className={student.session ? "session-badge" : ""}>{student.session}</span>;
      case 'name': return <span className="name-col">{student.name}</span>;
      case 'appStatus': return renderAppStatusCell(student);
      case 'intStatus': return (
        <span className="int-badge" onClick={() => setNotesModal({ show: true, student, fieldType: 'intStatus', note: '', newValue: student.intStatus || 'Interested and Responding' })} style={{ cursor: 'pointer' }}>
          {student.intStatus || 'Interested'}
        </span>
      );
      case 'sfeStatus': return (
        <span 
          className="int-badge" 
          onClick={() => setNotesModal({ show: true, student, fieldType: 'sfeStatus', note: '', newValue: student.sfeStatus || 'Assign for SFE' })} 
          onContextMenu={(e) => {
            e.preventDefault();
            setChaserModal({ show: true, student, readOnly: true, mode: 'sfe' });
          }}
          style={{ cursor: 'pointer', background: '#8b5cf6', color: '#fff' }}
        >
          {student.sfeStatus || 'Awaiting'}
        </span>
      );
      case 'appId': return <span style={{ color: '#818cf8' }}>{student.appId || '—'}</span>;
      case 'clTime': return student.clTime || '—';
      case 'route': return (
        <div onClick={() => setRouteModal({ show: true, student })} style={{ cursor: 'pointer', background: 'var(--bg-surface-hover)', minWidth: '150px' }}>
          {renderRouteCell(student)}
        </div>
      );
      case 'docs': return <span className="docs-badge">📄 {student.docs || '0'}</span>;
      case 'actions': return (
        <div className="actions-cell">
          <button className="action-btn view-btn" title="View" onClick={() => handleEditStudent(student, true)}>👁️</button>
          <button className="action-btn edit-btn" title="Edit" onClick={() => handleEditStudent(student, false)}>✏️</button>
          <button className="action-btn book-btn" title="Book Interview" onClick={() => setBookingModal({ show: true, student, date: '', time: '10:00', campus: '', notes: '' })}>💼</button>
        </div>
      );
      default:
        if (col.id === 'chaser') return renderCell(student, 'chaser', 'Click to assign');
        return renderCell(student, col.id);
    }
  };

  const visibleSortedColumns = tableColumns.filter(c => c.visible).sort((a,b) => a.order - b.order);

  return (
    <div className="dms-container">
      {toastMsg && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', background: '#10b981', color: '#fff', padding: '1rem 2rem', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 99999, fontWeight: 'bold', animation: 'fadeIn 0.3s ease' }}>
          ✓ {toastMsg}
        </div>
      )}
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
          <SearchableSelect className="dms-rows-select" value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </SearchableSelect>
        </div>
        <div className="dms-toolbar-right" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="dms-btn-filter" onClick={() => setShowFilters(!showFilters)}>⧨ Filters</button>
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button className="dms-btn-add" onClick={() => fileInputRef.current.click()}>Upload File</button>
          <button className="dms-btn-add" onClick={handleOpenAddModal}>+ Add Student</button>
        </div>
      </div>

      {showFilters && (
        <div style={{ padding: '1rem 1.5rem', background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {tableColumns.filter(c => c.filterable).sort((a,b) => a.order - b.order).map(col => {
            if (col.filterType === 'select') {
              let options = [];
              if (col.id === 'appStatus') options = appStatuses;
              else if (col.id === 'intStatus') options = intStatuses;
              else if (col.id === 'sfeStatus') options = sfeStatuses;
              else if (col.id === 'recruiter') options = uniqueRecruiters;
              else if (col.id === 'session') options = uniqueSessions;
              else if (col.id === 'agent') options = uniqueAgents;
              else if (col.id === 'chaser') options = uniqueChasers;
              else if (col.id === 'source') options = uniqueSources;
              else if (col.id === 'residential') options = uniqueResidential;
              else options = [...new Set(students.map(s => s[col.id]).filter(Boolean))];

              return (
                <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{col.label}</label>
                  <SearchableSelect value={filters[col.id] || ''} onChange={e => setFilters({...filters, [col.id]: e.target.value})} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                    <option value="">All</option>
                    {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </SearchableSelect>
                </div>
              );
            }
            return (
              <div key={col.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{col.label}</label>
                <input type="text" value={filters[col.id] || ''} onChange={e => setFilters({...filters, [col.id]: e.target.value})} placeholder={`Filter ${col.label.toLowerCase()}...`} style={{ padding: '0.4rem', borderRadius: '4px', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', width: '120px' }} />
              </div>
            );
          })}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowVerifiedOnly(!showVerifiedOnly)} style={{ padding: '0.4rem 1rem', background: showVerifiedOnly ? '#10b981' : 'var(--bg-surface)', color: showVerifiedOnly ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>{showVerifiedOnly ? '✓ Verified Only' : 'Show All Verified'}</button>
            <button onClick={() => setShowOrderedOnly(!showOrderedOnly)} style={{ padding: '0.4rem 1rem', background: showOrderedOnly ? '#3b82f6' : 'var(--bg-surface)', color: showOrderedOnly ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>{showOrderedOnly ? '✓ Ordered Only' : 'Show All Ordered'}</button>
            <button onClick={() => setShowReceivedOnly(!showReceivedOnly)} style={{ padding: '0.4rem 1rem', background: showReceivedOnly ? '#8b5cf6' : 'var(--bg-surface)', color: showReceivedOnly ? '#fff' : 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer' }}>{showReceivedOnly ? '✓ Received Only' : 'Show All Received'}</button>
            <button onClick={() => { setFilters({}); setShowVerifiedOnly(false); setShowOrderedOnly(false); setShowReceivedOnly(false); }} style={{ padding: '0.4rem 1rem', background: '#374151', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clear Filters</button>
          </div>
        </div>
      )}

      {/* Excel-style College Tabs */}
      {activeCollegeTab !== 'All Students' && collegeResponsible[activeCollegeTab] && (
        <div style={{ padding: '0.5rem 1.5rem', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          👤 Responsible Person for {activeCollegeTab}: <strong style={{ color: 'var(--text-primary)' }}>{collegeResponsible[activeCollegeTab]}</strong>
        </div>
      )}
      <div style={{ display: 'flex', gap: '0.2rem', overflowX: 'auto', padding: '0 1.5rem', marginTop: '0.5rem', borderBottom: `2px solid ${getTabStyle(activeCollegeTab).bg}`, scrollbarWidth: 'thin' }} className="college-tabs">
        {collegeTabs.map(tab => {
          const style = getTabStyle(tab);
          const isActive = activeCollegeTab === tab;
          return (
            <button 
              key={tab}
              onClick={() => { setActiveCollegeTab(tab); setCurrentPage(1); }}
              style={{ 
                padding: '0.6rem 1.2rem', 
                background: isActive ? style.bg : 'var(--bg-surface-hover)', 
                color: isActive ? style.tabText : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderBottom: 'none',
                borderRadius: '8px 8px 0 0',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 'bold' : 'normal',
                transition: 'background 0.2s',
                minWidth: 'max-content',
                ...(isActive && activeCollegeTab !== 'All Students' && { boxShadow: `0 -2px 10px rgba(0,0,0,0.1)` })
              }}
            >
              {tab}
            </button>
          )
        })}
      </div>

      {/* Target Status Boards */}
      {activeCollegeTab !== 'All Students' && targetsList.filter(t => t.college.toLowerCase() === activeCollegeTab.toLowerCase()).length > 0 && (
        <div style={{ padding: '0.8rem 1.5rem', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎯 Intake Targets:</span>
          {targetsList.filter(t => t.college.toLowerCase() === activeCollegeTab.toLowerCase()).map(tgt => {
            const studentsInSession = students.filter(s => 
              s.courseAndCampus1 && s.courseAndCampus1.toLowerCase().startsWith(activeCollegeTab.toLowerCase()) && (s.session || '').toLowerCase() === tgt.intake.toLowerCase()
            );
            const passCount = studentsInSession.filter(s => 
              (s.intStatus || '').toLowerCase().includes('pass') || 
              (s.intStatus || '').toLowerCase().includes('enrolled') ||
              (s.appStatus || '').toLowerCase().includes('enrolled')
            ).length;
            const progress = tgt.target > 0 ? Math.min(Math.round((passCount / tgt.target) * 100), 100) : 0;
            
            let progressColor = '#ef4444'; // Red for < 30%
            if (progress >= 100) progressColor = '#10b981'; // Green for 100%
            else if (progress >= 70) progressColor = '#3b82f6'; // Blue for 70-99%
            else if (progress >= 30) progressColor = '#f59e0b'; // Orange for 30-69%

            return (
              <div key={tgt.intake} style={{ background: 'var(--bg-color)', borderRadius: '8px', border: `1px solid ${progress >= 100 ? '#10b981' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', padding: '0.4rem 0.8rem', gap: '1.2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', minWidth: '220px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>{tgt.intake}</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', lineHeight: '1' }}>{passCount}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/ {tgt.target}</span>
                  </div>
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'flex-end', minWidth: '60px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: progressColor }}>{progress}%</span>
                  <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: progressColor, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                  </div>
                </div>
                
                {progress >= 100 && <span style={{ color: '#10b981', fontSize: '1rem', marginLeft: '-0.5rem' }} title="Target Met">✅</span>}
              </div>
            );
          })}
        </div>
      )}

      <div 
        className={`dms-table-wrapper ${activeCollegeTab !== 'All Students' ? 'colored-sheet-wrapper' : ''}`} 
        style={{ 
          marginTop: '0', 
          borderTopLeftRadius: '0',
          background: activeCollegeTab === 'All Students' ? 'var(--bg-surface)' : getTabStyle(activeCollegeTab).bg
        }}
      >
        <table className={`dms-table ${activeCollegeTab !== 'All Students' ? 'colored-sheet' : ''}`}>
          <thead>
            <tr>
              {visibleSortedColumns.map(col => <th key={col.id}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan={visibleSortedColumns.length} style={{ textAlign: 'center', padding: '2rem' }}>No records found.</td>
              </tr>
            )}
            {currentData.map((student, idx) => (
              <tr key={student._id || idx} className={student.statusType === 'red' ? 'row-red' : ''}>
                {visibleSortedColumns.map(col => (
                  <td key={col.id}>{renderTableCell(student, col)}</td>
                ))}
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
              {['Details', 'Address', 'Others', 'Documents', 'Route History'].map(tab => (
                <button 
                  key={tab} 
                  type="button" 
                  className={`dms-tab-btn ${activeModalTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveModalTab(tab)}
                >
                  {tab === 'Details' ? '👤 Details' : tab === 'Address' ? '📍 Address' : tab === 'Others' ? '⚙️ Others' : tab === 'Documents' ? '📄 Documents' : '📜 Route History'}
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
                    <SearchableSelect value={newStudent.residential} onChange={e => setNewStudent({...newStudent, residential: e.target.value})}>
                      <option value="">Select Status</option>
                      <option value="UK Resident">UK Resident</option>
                      <option value="International">International</option>
                    </SearchableSelect>
                  </div>
                  <div className="input-group">
                    <label>Session</label>
                    <SearchableSelect value={newStudent.session} onChange={e => setNewStudent({...newStudent, session: e.target.value})}>
                      <option value="">Select</option>
                      {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                    </SearchableSelect>
                  </div>
                  <div className="input-group">
                    <label>Date of Birth</label>
                    <input type="date" />
                  </div>
                  <div className="input-group">
                    <label>Recruiter</label>
                    <SearchableSelect value={newStudent.recruiter} onChange={e => setNewStudent({...newStudent, recruiter: e.target.value})}>
                      <option value="">Select</option>
                      {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                    </SearchableSelect>
                  </div>
                  <div className="input-group">
                    <label>Chaser</label>
                    <SearchableSelect value={newStudent.chaser} onChange={e => setNewStudent({...newStudent, chaser: e.target.value})}>
                      <option value="">Select</option>
                      {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                    </SearchableSelect>
                  </div>
                  <div className="input-group">
                    <label>Agent</label>
                    <SearchableSelect value={newStudent.agent} onChange={e => setNewStudent({...newStudent, agent: e.target.value})}>
                      <option value="">Select</option>
                      <option value="Direct">Direct</option>
                    </SearchableSelect>
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
                    <input 
                      list="course-options-add-1"
                      value={newStudent.courseAndCampus1 || ''} 
                      onChange={e => setNewStudent({...newStudent, courseAndCampus1: e.target.value})}
                      placeholder="Type to search..."
                      style={{ width: '100%', padding: '0.4rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)' }}
                    />
                    <datalist id="course-options-add-1">
                      {Object.entries(collegeCourses).flatMap(([c, courses]) => courses.map(course => (
                        <option key={`${c} - ${course}`} value={`${c} - ${course}`} />
                      )))}
                    </datalist>
                  </div>
                  <div className="input-group">
                    <label>Application Status</label>
                    <SearchableSelect value={newStudent.appStatus || ''} onChange={e => setNewStudent({...newStudent, appStatus: e.target.value})}>
                      {appStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </SearchableSelect>
                  </div>
                  <div className="input-group">
                    <label>Int Status</label>
                    <SearchableSelect value={newStudent.intStatus || ''} onChange={e => setNewStudent({...newStudent, intStatus: e.target.value})}>
                      {intStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </SearchableSelect>
                  </div>
                  <div className="input-group">
                    <label>SFE Status</label>
                    <SearchableSelect value={newStudent.sfeStatus || ''} onChange={e => setNewStudent({...newStudent, sfeStatus: e.target.value})}>
                      {sfeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </SearchableSelect>
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
                    <SearchableSelect value={newStudent.source} onChange={e => setNewStudent({...newStudent, source: e.target.value})}>
                      <option value="manual entry">manual entry</option>
                      <option value="FB Leads">FB Leads</option>
                      <option value="TikTok Leads">TikTok Leads</option>
                    </SearchableSelect>
                  </div>
                  <div className="input-group">
                    <label>Referral</label>
                    <input type="text" />
                  </div>
                  <div className="input-group">
                    <label>Request Status</label>
                    <input type="text" defaultValue="Working" />
                  </div>
                  
                  {renderRouteFields(newStudent, setNewStudent)}

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

              {activeModalTab === 'Route History' && (
                <div style={{ padding: '1rem', background: 'var(--bg-surface-hover)', borderRadius: '8px' }}>
                  {(!newStudent.routeHistory || newStudent.routeHistory.length === 0) ? (
                    <p style={{ color: 'var(--text-secondary)' }}>No route history found for this student.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {newStudent.routeHistory.slice().reverse().map((entry, idx) => (
                        <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <span><strong>{entry.user}</strong> updated route</span>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                              <span>{entry.timestamp}</span>
                              <button 
                                type="button"
                                onClick={() => handleDeleteHistory(entry)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '1rem' }}
                                title="Delete this record"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', color: 'var(--text-primary)' }}>
                            <div><strong>Route:</strong> {entry.route}</div>
                            {entry.routeCompany && <div><strong>Company:</strong> {entry.routeCompany}</div>}
                            {entry.routeJobRole && <div><strong>Job Role:</strong> {entry.routeJobRole}</div>}
                            {entry.routeQualification && <div><strong>Qualification:</strong> {entry.routeQualification}</div>}
                            {entry.routeCredits && <div><strong>Credits:</strong> {entry.routeCredits}</div>}
                            {entry.routeProvider && <div><strong>Provider:</strong> {entry.routeProvider}</div>}
                            {entry.routeNotes && <div><strong>Notes:</strong> {entry.routeNotes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

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

      {notesModal.show && (
        <div className="dms-modal-overlay">
          <div className="dms-modal" style={{ maxWidth: '600px', width: '100%', background: 'var(--bg-surface)' }}>
            <div className="dms-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent-color)' }}>✓</span> 
                {notesModal.fieldType === 'intStatus' ? 'Interview Status & Notes' : notesModal.fieldType === 'sfeStatus' ? 'SFE Status & Notes' : notesModal.fieldType === 'appStatus' ? 'Application Status Notes' : notesModal.fieldType === 'recruiter' ? 'Recruiter Notes' : 'Chaser Notes'}
              </h3>
              <button onClick={() => setNotesModal({ show: false, student: null, fieldType: null, note: '', newValue: undefined })} style={{ border: 'none', background: 'transparent', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
            </div>
            <div className="dms-modal-body" style={{ maxHeight: '75vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
              
              <div style={{ background: 'var(--bg-surface-hover)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>STUDENT</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{notesModal.student.name}</div>
                  <div style={{ color: 'var(--accent-color)', fontSize: '0.85rem' }}>{notesModal.student.email || 'null'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 'bold' }}>CURRENT {notesModal.fieldType === 'recruiter' || notesModal.fieldType === 'chaser' ? 'ASSIGNEE' : 'STATUS'}</div>
                  <div style={{ background: 'var(--bg-color)', color: 'var(--text-primary)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', border: '1px solid var(--border-color)' }}>
                     <span style={{ height: '10px', width: '10px', background: 'var(--text-secondary)', borderRadius: '50%', display: 'inline-block' }}></span>
                     {notesModal.student[notesModal.fieldType] || 'None'}
                  </div>
                </div>
              </div>

              {notesModal.fieldType === 'intStatus' ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Update Interview Status</label>
                  <SearchableSelect 
                    value={notesModal.newValue !== undefined ? notesModal.newValue : (notesModal.student.intStatus || 'Interested and Responding')}
                    onChange={e => setNotesModal({...notesModal, newValue: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-color)' }}
                  >
                     {intStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </SearchableSelect>
                </div>
              ) : notesModal.fieldType === 'sfeStatus' ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Update SFE Status</label>
                  <SearchableSelect 
                    value={notesModal.newValue !== undefined ? notesModal.newValue : (notesModal.student.sfeStatus || 'Assign for SFE')}
                    onChange={e => setNotesModal({...notesModal, newValue: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-color)' }}
                  >
                     {sfeStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </SearchableSelect>
                </div>
              ) : notesModal.fieldType === 'appStatus' ? (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Update Application Status</label>
                  <SearchableSelect 
                    value={notesModal.newValue !== undefined ? notesModal.newValue : (notesModal.student.appStatus || 'Assign for submission')}
                    onChange={e => setNotesModal({...notesModal, newValue: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-color)' }}
                  >
                     {appStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </SearchableSelect>
                </div>
              ) : (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Update Assignee</label>
                  <SearchableSelect 
                    value={notesModal.newValue !== undefined ? notesModal.newValue : (notesModal.student[notesModal.fieldType] || '')}
                    onChange={e => setNotesModal({...notesModal, newValue: e.target.value})}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-color)' }}
                  >
                     <option value="">Select Assignee</option>
                     {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </SearchableSelect>
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <span>💭</span> Add Note (Optional)
                </label>
                <textarea 
                  rows="3"
                  value={notesModal.note}
                  onChange={e => setNotesModal({...notesModal, note: e.target.value})}
                  placeholder={notesModal.fieldType === 'intStatus' || notesModal.fieldType === 'sfeStatus' ? "Add a note about this status change..." : "Type an important note here..."}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-color)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleNotesModalSave}
                  style={{ flex: 1, minWidth: '200px', background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  💾 Save Changes
                </button>

                <button 
                  onClick={() => setNotesModal({ show: false, student: null, fieldType: null, note: '', newValue: undefined })}
                  style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />
              
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
                <span>⏱️</span> Notes History <span style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', border: '1px solid var(--border-color)' }}>{notesModal.student[`${notesModal.fieldType}History`]?.length || 0}</span>
              </h4>

              {(!notesModal.student[`${notesModal.fieldType}History`] || notesModal.student[`${notesModal.fieldType}History`].length === 0) ? (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                  <div>No notes yet</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {notesModal.student[`${notesModal.fieldType}History`].slice().reverse().map((entry, idx) => (
                    <div key={idx} style={{ background: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {entry.user ? entry.user.substring(0, 2).toUpperCase() : 'U'}
                          </div>
                          <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{entry.user}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{entry.timestamp}</span>
                          <button 
                            type="button"
                            onClick={async () => {
                              if (!window.confirm("Are you sure you want to delete this note?")) return;
                              const hField = `${notesModal.fieldType}History`;
                              const newHistory = notesModal.student[hField].filter(e => e !== entry);
                              const updatedStudent = { ...notesModal.student, [hField]: newHistory };
                              
                              setNotesModal({ ...notesModal, student: updatedStudent });
                              setStudents(students.map(s => s._id === updatedStudent._id ? updatedStudent : s));
                              
                              try {
                                await fetch(`${API_BASE}/api/students/${updatedStudent._id}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ [hField]: newHistory })
                                });
                              } catch (e) { console.error(e); }
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, fontSize: '1rem' }}
                            title="Delete this record"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                        {entry.note || `Value updated to: ${entry.status || entry.assignee}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {chaserModal.show && (
        <div className="dms-modal-overlay">
          <div className="dms-modal" style={{ maxWidth: chaserModal.readOnly ? '600px' : '400px' }}>
            <div className="dms-modal-header">
              <h3>{chaserModal.readOnly ? (chaserModal.mode === 'sfe' ? 'SFE Assignment Report' : 'Team Assignment Report') : 'Assign Chasers'}</h3>
              <button onClick={() => setChaserModal({ show: false, student: null, readOnly: false })}>✗</button>
            </div>
            
            {chaserModal.readOnly ? (
              <div className="dms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Assigned personnel for <strong>{chaserModal.student.name}</strong></p>
                <div style={{ display: 'grid', gridTemplateColumns: chaserModal.mode === 'sfe' ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  {(chaserModal.mode === 'sfe' ? [
                    { role: 'SFE Officer', name: chaserModal.student.chasers?.sfe, icon: '💸', color: '#8b5cf6' }
                  ] : [
                    { role: 'CV Chaser', name: chaserModal.student.chasers?.cv, icon: '📄', color: '#3b82f6' },
                    { role: 'PS Chaser', name: chaserModal.student.chasers?.ps, icon: '📝', color: '#8b5cf6' },
                    { role: 'Submission & QC', name: chaserModal.student.chasers?.sub, icon: '📤', color: '#f59e0b' },
                    { role: 'QA Chaser', name: chaserModal.student.chasers?.qa, icon: '✅', color: '#10b981' }
                  ]).map((item, idx) => (
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
                  <SearchableSelect value={chaserModal.student.chasers?.cv || ''} onChange={(e) => handleChaserChange('cv', e.target.value)}>
                    <option value="">Select Person</option>
                    {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </SearchableSelect>
                </div>
                <div className="input-group">
                  <label>PS Chaser</label>
                  <SearchableSelect value={chaserModal.student.chasers?.ps || ''} onChange={(e) => handleChaserChange('ps', e.target.value)}>
                    <option value="">Select Person</option>
                    {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </SearchableSelect>
                </div>
                <div className="input-group">
                  <label>Submission & QC</label>
                  <SearchableSelect value={chaserModal.student.chasers?.sub || ''} onChange={(e) => handleChaserChange('sub', e.target.value)}>
                    <option value="">Select Person</option>
                    {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </SearchableSelect>
                </div>
                <div className="input-group">
                  <label>QA Chaser</label>
                  <SearchableSelect value={chaserModal.student.chasers?.qa || ''} onChange={(e) => handleChaserChange('qa', e.target.value)}>
                    <option value="">Select Person</option>
                    {users.map(u => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </SearchableSelect>
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

      {routeModal.show && (
        <div className="dms-modal-overlay">
          <div className="dms-modal" style={{ maxWidth: '400px' }}>
            <div className="dms-modal-header">
              <h3>Edit Route</h3>
              <button onClick={() => setRouteModal({ show: false, student: null })}>✗</button>
            </div>
            <div className="dms-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {renderRouteFields(routeModal.student, (newState) => setRouteModal({ ...routeModal, student: newState }))}

              <div className="dms-modal-footer" style={{ marginTop: '1rem' }}>
                <button 
                  type="button" 
                  className="dms-btn-save" 
                  onClick={async () => {
                    let student = routeModal.student;
                    student.routeHistory = [...(student.routeHistory || []), createRouteHistoryEntry(student)];
                    
                    setStudents(students.map(s => s._id === student._id ? student : s));
                    setRouteModal({ show: false, student: null });
                    try {
                      await fetch(`${API_BASE}/api/students/${student._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(student)
                      });
                      logActivity('Student Edit', `Updated route to ${student.route} for ${student.name}`);
                    } catch (err) {
                      console.error(err);
                    }
                  }} 
                  style={{ width: '100%' }}
                >
                  Save Route
                </button>
              </div>
            </div>
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
