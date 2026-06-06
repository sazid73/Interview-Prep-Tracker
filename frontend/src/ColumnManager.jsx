import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export const defaultColumnsConfig = [
  { id: 'checkbox', label: '', visible: true, order: 0, isSpecial: true, filterable: false },
  { id: 'studentId', label: '#', visible: true, order: 1, isSpecial: true, filterable: false },
  { id: 'source', label: 'SOURCES', visible: true, order: 2, isSpecial: false, filterable: true, filterType: 'select' },
  { id: 'recruiter', label: 'RECRUITER', visible: true, order: 3, isSpecial: false, filterable: true, filterType: 'select' },
  { id: 'createdAt', label: 'CREATED', visible: true, order: 4, isSpecial: true, filterable: false },
  { id: 'modifiedAt', label: 'MODIFIED', visible: true, order: 5, isSpecial: true, filterable: false },
  { id: 'session', label: 'SESSION', visible: true, order: 6, isSpecial: true, filterable: true, filterType: 'select' },
  { id: 'name', label: 'NAME', visible: true, order: 7, isSpecial: true, filterable: false },
  { id: 'email', label: 'EMAIL', visible: true, order: 8, isSpecial: false, filterable: false },
  { id: 'mobile', label: 'MOBILE', visible: true, order: 9, isSpecial: false, filterable: false },
  { id: 'courseAndCampus1', label: 'COURSE & CAMPUS 1', visible: true, order: 10, isSpecial: false, filterable: true, filterType: 'text' },
  { id: 'courseAndCampus2', label: 'COURSE & CAMPUS 2', visible: true, order: 11, isSpecial: false, filterable: false },
  { id: 'appStatus', label: 'APP STATUS', visible: true, order: 12, isSpecial: true, filterable: true, filterType: 'select' },
  { id: 'intStatus', label: 'INT STATUS', visible: true, order: 13, isSpecial: true, filterable: true, filterType: 'select' },
  { id: 'sfeStatus', label: 'SFE STATUS', visible: true, order: 14, isSpecial: true, filterable: true, filterType: 'select' },
  { id: 'chaser', label: 'CHASER', visible: true, order: 15, isSpecial: false, filterable: true, filterType: 'select' },
  { id: 'agent', label: 'AGENT', visible: true, order: 16, isSpecial: false, filterable: true, filterType: 'select' },
  { id: 'residential', label: 'RESIDENTIAL', visible: true, order: 17, isSpecial: false, filterable: true, filterType: 'select' },
  { id: 'location', label: 'LOCATION', visible: true, order: 18, isSpecial: false, filterable: true, filterType: 'text' },
  { id: 'appId', label: 'APPL ID', visible: true, order: 19, isSpecial: true, filterable: false },
  { id: 'clTime', label: 'CL TIME', visible: true, order: 20, isSpecial: true, filterable: false },
  { id: 'route', label: 'ROUTE', visible: true, order: 21, isSpecial: true, filterable: true, filterType: 'select' },
  { id: 'docs', label: 'DOCS', visible: true, order: 22, isSpecial: true, filterable: false },
  { id: 'actions', label: 'ACTIONS', visible: true, order: 23, isSpecial: true, filterable: false }
];

const ColumnManager = ({ currentUserRole, currentUser, currentUserData }) => {
  const [columns, setColumns] = useState([]);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColFilterable, setNewColFilterable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingColId, setEditingColId] = useState(null);
  const [editingColValue, setEditingColValue] = useState('');

  const isAdmin = currentUserData?.abilities?.includes('super_admin') 
               || currentUserData?.abilities?.includes('manage_settings') 
               || currentUserRole === 'admin' 
               || currentUserRole === 'super_admin';

  useEffect(() => {
    fetch(`${API_BASE}/api/grid`)
      .then(res => res.json())
      .then(data => {
         const colConfig = data['DMS_COLUMNS_CONFIG'];
         if (colConfig && colConfig.slots && colConfig.slots[0] && colConfig.slots[0].text) {
           setColumns(JSON.parse(colConfig.slots[0].text));
         } else {
           setColumns(defaultColumnsConfig);
         }
      })
      .catch(e => {
        console.error("Failed to load columns config", e);
        setColumns(defaultColumnsConfig);
      });
  }, []);

  const saveConfig = async (newColumns, details) => {
    setIsSaving(true);
    try {
      await fetch(`${API_BASE}/api/grid/DMS_COLUMNS_CONFIG`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color: '', textColor: '', slots: [{ text: JSON.stringify(newColumns) }] })
      });
      
      fetch(`${API_BASE}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timestamp: new Date().toLocaleString(), user: currentUser || 'Unknown', action: 'Column Config', details })
      }).catch(e => console.error(e));
      
      setColumns(newColumns);
    } catch (err) {
      console.error(err);
      alert('Failed to save configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisible = (id) => {
    if (!isAdmin) return;
    const updated = columns.map(c => c.id === id ? { ...c, visible: !c.visible } : c);
    saveConfig(updated, `Toggled visibility for column ${id}`);
  };

  const handleToggleFilterable = (id) => {
    if (!isAdmin) return;
    const updated = columns.map(c => c.id === id ? { ...c, filterable: !c.filterable } : c);
    saveConfig(updated, `Toggled filterable for column ${id}`);
  };

  const handleMoveUp = (index) => {
    if (!isAdmin || index === 0) return;
    const updated = [...columns];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    // Update order values
    updated.forEach((c, idx) => c.order = idx);
    saveConfig(updated, `Moved column ${temp.label} up`);
  };

  const handleMoveDown = (index) => {
    if (!isAdmin || index === columns.length - 1) return;
    const updated = [...columns];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    // Update order values
    updated.forEach((c, idx) => c.order = idx);
    saveConfig(updated, `Moved column ${temp.label} down`);
  };

  const handleEditColumnName = (id, newName) => {
    if (!isAdmin || !newName.trim()) {
      setEditingColId(null);
      return;
    }
    const updated = columns.map(c => c.id === id ? { ...c, label: newName.trim().toUpperCase() } : c);
    saveConfig(updated, `Renamed column ${id} to ${newName}`);
    setEditingColId(null);
  };

  const handleAddColumn = (e) => {
    e.preventDefault();
    if (!isAdmin || !newColLabel.trim()) return;
    
    // Generate an ID
    const customId = 'custom_' + newColLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    
    const newCol = {
      id: customId,
      label: newColLabel.trim().toUpperCase(),
      visible: true,
      order: columns.length,
      isSpecial: false,
      isCustom: true,
      filterable: newColFilterable,
      filterType: 'text'
    };
    
    const updated = [...columns, newCol];
    saveConfig(updated, `Added custom column: ${newCol.label}`);
    setNewColLabel('');
    setNewColFilterable(false);
  };

  const handleRemoveColumn = (id) => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to completely remove this custom column?`)) return;
    
    const colToRemove = columns.find(c => c.id === id);
    const updated = columns.filter(c => c.id !== id);
    updated.forEach((c, idx) => c.order = idx);
    
    saveConfig(updated, `Removed custom column: ${colToRemove.label}`);
  };

  const handleReset = () => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to reset to default columns? This will remove all custom columns.`)) return;
    saveConfig(defaultColumnsConfig, `Reset columns to default`);
  };

  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Column & Filter Manager</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage Student DMS table columns. Add new fields, reorder, hide, and toggle filters.</p>
        </div>
        {isAdmin && (
          <button onClick={handleReset} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Reset to Default
          </button>
        )}
      </div>

      {!isAdmin && (
        <div style={{ marginBottom: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🔒</span> You are viewing in read-only mode. Only administrators can modify column settings.
        </div>
      )}

      {isAdmin && (
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--text-primary)', marginTop: 0, marginBottom: '1rem' }}>+ Add Custom Column</h3>
          <form onSubmit={handleAddColumn} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Column Name</label>
              <input 
                type="text" 
                value={newColLabel}
                onChange={e => setNewColLabel(e.target.value)}
                placeholder="e.g. Nationality"
                required
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.6rem' }}>
              <input 
                type="checkbox" 
                id="isFilterable" 
                checked={newColFilterable}
                onChange={e => setNewColFilterable(e.target.checked)}
              />
              <label htmlFor="isFilterable" style={{ color: 'var(--text-primary)', cursor: 'pointer' }}>Filterable in Search Bar</label>
            </div>
            <button 
              type="submit"
              disabled={isSaving}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '0.6rem 2rem', borderRadius: '6px', cursor: isSaving ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
            >
              Add Column
            </button>
          </form>
        </div>
      )}

      <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'var(--bg-surface-hover)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <tr>
              <th style={{ padding: '1rem' }}>ORDER</th>
              <th style={{ padding: '1rem' }}>COLUMN NAME</th>
              <th style={{ padding: '1rem' }}>VISIBLE (TABLE)</th>
              <th style={{ padding: '1rem' }}>FILTERABLE (SEARCH)</th>
              <th style={{ padding: '1rem' }}>TYPE</th>
              {isAdmin && <th style={{ padding: '1rem', textAlign: 'right' }}>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {sortedColumns.map((col, index) => (
              <tr key={col.id} style={{ borderTop: '1px solid var(--border-color)', opacity: col.visible ? 1 : 0.6 }}>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)', width: '80px' }}>
                  {index + 1}
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                  {editingColId === col.id ? (
                    <input
                      autoFocus
                      value={editingColValue}
                      onChange={e => setEditingColValue(e.target.value)}
                      onBlur={() => handleEditColumnName(col.id, editingColValue)}
                      onKeyDown={e => e.key === 'Enter' && handleEditColumnName(col.id, editingColValue)}
                      style={{ padding: '0.4rem', width: '100%', background: 'var(--bg-surface)', color: 'var(--text-primary)', border: '1px solid var(--accent-color)' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{col.label || '(No Label)'}</span>
                      {isAdmin && (
                        <button onClick={() => { setEditingColId(col.id); setEditingColValue(col.label); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }} title="Edit Name">✏️</button>
                      )}
                      {col.isCustom && <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '0.7rem' }}>Custom</span>}
                    </div>
                  )}
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    onClick={() => handleToggleVisible(col.id)}
                    disabled={!isAdmin || col.id === 'studentId' || col.id === 'actions'}
                    style={{ 
                      background: col.visible ? '#10b981' : 'var(--bg-surface-hover)', 
                      color: col.visible ? '#fff' : 'var(--text-secondary)', 
                      border: 'none', padding: '0.4rem 1rem', borderRadius: '20px', cursor: (isAdmin && col.id !== 'studentId' && col.id !== 'actions') ? 'pointer' : 'not-allowed', fontSize: '0.8rem', fontWeight: 'bold'
                    }}
                  >
                    {col.visible ? 'VISIBLE' : 'HIDDEN'}
                  </button>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button 
                    onClick={() => handleToggleFilterable(col.id)}
                    disabled={!isAdmin || col.isSpecial && !col.filterable} // Prevent making unfilterable specials filterable if they don't support it natively yet
                    style={{ 
                      background: col.filterable ? '#8b5cf6' : 'var(--bg-surface-hover)', 
                      color: col.filterable ? '#fff' : 'var(--text-secondary)', 
                      border: 'none', padding: '0.4rem 1rem', borderRadius: '20px', cursor: (isAdmin && !(col.isSpecial && !col.filterable)) ? 'pointer' : 'not-allowed', fontSize: '0.8rem', fontWeight: 'bold'
                    }}
                  >
                    {col.filterable ? 'FILTER ON' : 'FILTER OFF'}
                  </button>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {col.isSpecial ? 'System' : 'Standard'}
                </td>
                {isAdmin && (
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => handleMoveUp(index)} disabled={index === 0} style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem', borderRadius: '4px', cursor: index === 0 ? 'not-allowed' : 'pointer' }} title="Move Up">
                        ⬆️
                      </button>
                      <button onClick={() => handleMoveDown(index)} disabled={index === columns.length - 1} style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem', borderRadius: '4px', cursor: index === columns.length - 1 ? 'not-allowed' : 'pointer' }} title="Move Down">
                        ⬇️
                      </button>
                      {col.isCustom && (
                        <button onClick={() => handleRemoveColumn(col.id)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '0.4rem', borderRadius: '4px', cursor: 'pointer', marginLeft: '0.5rem' }} title="Delete">
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ColumnManager;
