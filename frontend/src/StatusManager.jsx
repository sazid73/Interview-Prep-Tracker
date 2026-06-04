import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

const defaultAppStatuses = [
  "Awaiting submission",
  "Submission ongoing",
  "Submitted"
];

const defaultIntStatuses = [
  "Interested and Responding",
  "Interested - Awaiting Docs",
  "Interested - Further Info Required",
  "Fully Enrolled",
  "Not eligible - Check Later",
  "Awaiting SFE",
  "Awaiting Prep"
];

const StatusManager = ({ currentUserRole, currentUser }) => {
  const [appStatuses, setAppStatuses] = useState(defaultAppStatuses);
  const [intStatuses, setIntStatuses] = useState(defaultIntStatuses);
  
  const [newAppStatus, setNewAppStatus] = useState('');
  const [newIntStatus, setNewIntStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
          <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem' }}>📱 Application Statuses</h3>
          
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
                <span>{status}</span>
                {isAdmin && (
                  <button 
                    onClick={() => handleRemoveAppStatus(status)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                    title="Remove"
                  >
                    🗑️
                  </button>
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
          <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem' }}>💬 Interview Statuses</h3>
          
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
                <span>{status}</span>
                {isAdmin && (
                  <button 
                    onClick={() => handleRemoveIntStatus(status)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.2rem' }}
                    title="Remove"
                  >
                    🗑️
                  </button>
                )}
              </li>
            ))}
            {intStatuses.length === 0 && (
              <li style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>No interview statuses defined.</li>
            )}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default StatusManager;
