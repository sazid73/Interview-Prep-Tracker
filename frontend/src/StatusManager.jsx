import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const defaultAppStatuses = [
  "Awaiting submission",
  "Submission ongoing",
  "Submitted"
];

const defaultIntStatuses = [
  "Interested and Responding",
  "Declined",
  "Prep Done",
  "Offer Sent",
  "SFE Not Approved",
  "On Hold - Check Later (AN)",
  "SFE Approved - Process Next Steps",
  "On Holiday (AN)",
  "Awaiting Further Entry Criteria Docs/Info (AN)",
  "Awaiting Necessary Pretask For Act Int",
  "DNC (AN)",
  "File Withdrawn (AN)",
  "File Declined (AN)",
  "Fully Enrolled 3rd Year",
  "Fully Enrolled 2nd Year",
  "Awaiting Interview Result",
  "Awaiting Prep",
  "Interview Passed - Proceed Next Steps",
  "Interested - Awaiting Docs",
  "Interested - Call Back Later",
  "Failed - Try Within Time-frame/Process Elsewhere",
  "SFE Submitted - Awaiting Approval",
  "Awaiting Submission",
  "At Risk Of Cancelation",
  "No Longer Interested",
  "Interested - Not Responding",
  "Interested - Further Info Required",
  "New Application",
  "Direct",
  "Fully Enrolled",
  "Awaiting Induction",
  "Awaiting Transfer",
  "Awaiting SFE",
  "Awaiting QC",
  "Awaiting Offer Letter",
  "Awaiting Actual Interview",
  "Not eligible - Check Later",
  "Received 3rd Payment",
  "Received 2nd Payment",
  "Received 1st payment",
  "Not Progressed To 3rd Year",
  "Not Progressed to 2nd Year",
  "Did not received 3rd Payment",
  "Did not received 2nd payment",
  "Did Not Received First Payment",
  "Deferred",
  "On holiday - Please follow up later",
  "QC done"
];

const defaultSfeStatuses = [
  "Awaiting Trial SFE Approval",
  "Trial SFE submitted",
  "Trial SFE Approved",
  "SFE Submitted - Docs Pending",
  "SFE Submitted - Awaiting Approval",
  "SFE Approved - Awaiting enrollment",
  "Awaiting SFE Approval -",
  "Enrollment Done",
  "SFE Approved - Deferred",
  "Ineligible for SFE"
];

const StatusManager = ({ currentUserRole, currentUser }) => {
  const [appStatuses, setAppStatuses] = useState(defaultAppStatuses);
  const [intStatuses, setIntStatuses] = useState(defaultIntStatuses);
  const [sfeStatuses, setSfeStatuses] = useState(defaultSfeStatuses);
  
  const [newAppStatus, setNewAppStatus] = useState('');
  const [newIntStatus, setNewIntStatus] = useState('');
  const [newSfeStatus, setNewSfeStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editState, setEditState] = useState({ type: null, index: null, value: '' });

  const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';

  useEffect(() => {
    fetch(`${API_BASE}/api/grid`)
      .then(res => res.json())
      .then(data => {
         const appConfig = data['APP_STATUSES'];
         if (appConfig && appConfig.slots && appConfig.slots[0] && appConfig.slots[0].text) {
           setAppStatuses(JSON.parse(appConfig.slots[0].text));
         }
         
         const intConfig = data['INT_STATUSES'];
         if (intConfig && intConfig.slots && intConfig.slots[0] && intConfig.slots[0].text) {
           setIntStatuses(JSON.parse(intConfig.slots[0].text));
         }
         
         const sfeConfig = data['SFE_STATUSES'];
         if (sfeConfig && sfeConfig.slots && sfeConfig.slots[0] && sfeConfig.slots[0].text) {
           setSfeStatuses(JSON.parse(sfeConfig.slots[0].text));
         }
      })
      .catch(e => console.error("Failed to load status config", e));
  }, []);

  const saveToGrid = async (key, dataArray, logDetails) => {
    try {
      await fetch(`${API_BASE}/api/grid/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: '', textColor: '', slots: [{ text: JSON.stringify(dataArray) }] })
      });
      
      fetch(`${API_BASE}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          timestamp: new Date().toLocaleString(), 
          user: currentUser || 'Unknown', 
          action: 'Status Config', 
          details: logDetails 
        })
      }).catch(e => console.error(e));
      
      return true;
    } catch (err) {
      console.error(err);
      alert('Failed to save to server.');
      return false;
    }
  };

  const handleAddAppStatus = async (e) => {
    e.preventDefault();
    if (!newAppStatus.trim() || !isAdmin) return;
    
    setIsSaving(true);
    const updated = [...appStatuses, newAppStatus.trim()];
    setAppStatuses(updated);
    setNewAppStatus('');
    
    await saveToGrid('APP_STATUSES', updated, `Added App Status: ${newAppStatus.trim()}`);
    setIsSaving(false);
  };

  const handleAddIntStatus = async (e) => {
    e.preventDefault();
    if (!newIntStatus.trim() || !isAdmin) return;
    
    setIsSaving(true);
    const updated = [...intStatuses, newIntStatus.trim()];
    setIntStatuses(updated);
    setNewIntStatus('');
    
    await saveToGrid('INT_STATUSES', updated, `Added Int Status: ${newIntStatus.trim()}`);
    setIsSaving(false);
  };

  const handleAddSfeStatus = async (e) => {
    e.preventDefault();
    if (!newSfeStatus.trim() || !isAdmin) return;
    
    setIsSaving(true);
    const updated = [...sfeStatuses, newSfeStatus.trim()];
    setSfeStatuses(updated);
    setNewSfeStatus('');
    
    await saveToGrid('SFE_STATUSES', updated, `Added SFE Status: ${newSfeStatus.trim()}`);
    setIsSaving(false);
  };

  const handleRemoveAppStatus = async (statusToRemove) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to remove "${statusToRemove}"?`)) return;
    
    setIsSaving(true);
    const updated = appStatuses.filter(s => s !== statusToRemove);
    setAppStatuses(updated);
    
    await saveToGrid('APP_STATUSES', updated, `Removed App Status: ${statusToRemove}`);
    setIsSaving(false);
  };

  const handleRemoveIntStatus = async (statusToRemove) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to remove "${statusToRemove}"?`)) return;
    
    setIsSaving(true);
    const updated = intStatuses.filter(s => s !== statusToRemove);
    setIntStatuses(updated);
    
    await saveToGrid('INT_STATUSES', updated, `Removed Int Status: ${statusToRemove}`);
    setIsSaving(false);
  };

  const handleRemoveSfeStatus = async (statusToRemove) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to remove "${statusToRemove}"?`)) return;
    
    setIsSaving(true);
    const updated = sfeStatuses.filter(s => s !== statusToRemove);
    setSfeStatuses(updated);
    
    await saveToGrid('SFE_STATUSES', updated, `Removed SFE Status: ${statusToRemove}`);
    setIsSaving(false);
  };

  const handleEditStatus = async (type, index, newValue) => {
    if (!isAdmin || !newValue.trim()) {
      setEditState({ type: null, index: null, value: '' });
      return;
    }
    setIsSaving(true);
    let updated = [];
    if (type === 'APP') {
       updated = [...appStatuses];
       updated[index] = newValue.trim();
       setAppStatuses(updated);
       await saveToGrid('APP_STATUSES', updated, `Edited App Status to: ${newValue}`);
    } else if (type === 'INT') {
       updated = [...intStatuses];
       updated[index] = newValue.trim();
       setIntStatuses(updated);
       await saveToGrid('INT_STATUSES', updated, `Edited Int Status to: ${newValue}`);
    } else if (type === 'SFE') {
       updated = [...sfeStatuses];
       updated[index] = newValue.trim();
       setSfeStatuses(updated);
       await saveToGrid('SFE_STATUSES', updated, `Edited SFE Status to: ${newValue}`);
    }
    setEditState({ type: null, index: null, value: '' });
    setIsSaving(false);
  };

  const handleResetToDefault = async (type) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to reset this list to the default statuses? Custom additions will be lost.`)) return;
    
    setIsSaving(true);
    if (type === 'APP') {
       setAppStatuses(defaultAppStatuses);
       await saveToGrid('APP_STATUSES', defaultAppStatuses, `Reset App Statuses to default`);
    } else if (type === 'INT') {
       setIntStatuses(defaultIntStatuses);
       await saveToGrid('INT_STATUSES', defaultIntStatuses, `Reset Int Statuses to default`);
    } else if (type === 'SFE') {
       setSfeStatuses(defaultSfeStatuses);
       await saveToGrid('SFE_STATUSES', defaultSfeStatuses, `Reset SFE Statuses to default`);
    }
    setIsSaving(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Status Management</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Manage the drop-down options for Application Status and Interview Status.</p>
      </div>

      {!isAdmin && (
        <div style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔒</span> You are viewing in read-only mode. Only administrators can modify statuses.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* App Statuses Section */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>📱 Application Statuses</h3>
            {isAdmin && <button onClick={() => handleResetToDefault('APP')} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset Defaults</button>}
          </div>
          
          {isAdmin && (
            <form onSubmit={handleAddAppStatus} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                value={newAppStatus}
                onChange={e => setNewAppStatus(e.target.value)}
                placeholder="New App Status"
                required
                style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
              <button 
                type="submit"
                disabled={isSaving}
                style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0 1rem', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                Add
              </button>
            </form>
          )}

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {appStatuses.map((status, idx) => (
              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                {editState.type === 'APP' && editState.index === idx ? (
                  <input 
                    autoFocus
                    value={editState.value}
                    onChange={(e) => setEditState({ ...editState, value: e.target.value })}
                    onBlur={() => handleEditStatus('APP', idx, editState.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditStatus('APP', idx, editState.value)}
                    style={{ flex: 1, marginRight: '1rem', padding: '0.4rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)' }}
                  />
                ) : (
                  <span>{status}</span>
                )}
                {isAdmin && editState.type !== 'APP' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setEditState({ type: 'APP', index: idx, value: status })}
                      style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '0.2rem' }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleRemoveAppStatus(status)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </li>
            ))}
            {appStatuses.length === 0 && (
              <li style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No app statuses defined.</li>
            )}
          </ul>
        </div>

        {/* Int Statuses Section */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>💬 Interview Statuses</h3>
            {isAdmin && <button onClick={() => handleResetToDefault('INT')} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset Defaults</button>}
          </div>
          
          {isAdmin && (
            <form onSubmit={handleAddIntStatus} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                value={newIntStatus}
                onChange={e => setNewIntStatus(e.target.value)}
                placeholder="New Int Status"
                required
                style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
              <button 
                type="submit"
                disabled={isSaving}
                style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0 1rem', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                Add
              </button>
            </form>
          )}

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {intStatuses.map((status, idx) => (
              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                {editState.type === 'INT' && editState.index === idx ? (
                  <input 
                    autoFocus
                    value={editState.value}
                    onChange={(e) => setEditState({ ...editState, value: e.target.value })}
                    onBlur={() => handleEditStatus('INT', idx, editState.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditStatus('INT', idx, editState.value)}
                    style={{ flex: 1, marginRight: '1rem', padding: '0.4rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)' }}
                  />
                ) : (
                  <span>{status}</span>
                )}
                {isAdmin && editState.type !== 'INT' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setEditState({ type: 'INT', index: idx, value: status })}
                      style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '0.2rem' }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleRemoveIntStatus(status)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </li>
            ))}
            {intStatuses.length === 0 && (
              <li style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No interview statuses defined.</li>
            )}
          </ul>
        </div>

        {/* SFE Statuses Section */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>🎓 SFE Statuses</h3>
            {isAdmin && <button onClick={() => handleResetToDefault('SFE')} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Reset Defaults</button>}
          </div>
          
          {isAdmin && (
            <form onSubmit={handleAddSfeStatus} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input 
                type="text" 
                value={newSfeStatus}
                onChange={e => setNewSfeStatus(e.target.value)}
                placeholder="New SFE Status"
                required
                style={{ flex: 1, padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
              <button 
                type="submit"
                disabled={isSaving}
                style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '0 1rem', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer' }}
              >
                Add
              </button>
            </form>
          )}

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {sfeStatuses.map((status, idx) => (
              <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-color)', padding: '0.8rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                {editState.type === 'SFE' && editState.index === idx ? (
                  <input 
                    autoFocus
                    value={editState.value}
                    onChange={(e) => setEditState({ ...editState, value: e.target.value })}
                    onBlur={() => handleEditStatus('SFE', idx, editState.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEditStatus('SFE', idx, editState.value)}
                    style={{ flex: 1, marginRight: '1rem', padding: '0.4rem', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)' }}
                  />
                ) : (
                  <span>{status}</span>
                )}
                {isAdmin && editState.type !== 'SFE' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setEditState({ type: 'SFE', index: idx, value: status })}
                      style={{ background: 'transparent', border: 'none', color: '#8b5cf6', cursor: 'pointer', padding: '0.2rem' }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleRemoveSfeStatus(status)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </li>
            ))}
            {sfeStatuses.length === 0 && (
              <li style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No SFE statuses defined.</li>
            )}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default StatusManager;
