import React, { useState, useEffect } from 'react';
import StatusManager from './StatusManager';
import ColumnManager from './ColumnManager';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Settings = ({ currentUserRole, currentUser, currentUserData }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [adminUsersList, setAdminUsersList] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserJobTitles, setNewUserJobTitles] = useState([]);
  const [newUserAbilities, setNewUserAbilities] = useState([]);
  const [newUserError, setNewUserError] = useState('');
  const [editingUser, setEditingUser] = useState(null); // Used to edit an existing user's config

  const JOB_TITLES = ['Recruiter', 'Chaser', 'Prep Coach', 'Admin Officer', 'SFE Officer', 'Manager', 'Team Leader', 'Assistant Team Leader'];
  const ABILITIES = [
    { id: 'super_admin', label: 'Super Admin (Full Access)' },
    { id: 'manage_users', label: 'Manage Users & Access' },
    { id: 'assign_tasks', label: 'Assign Tasks to Others' },
    { id: 'manage_settings', label: 'Manage System Settings (Columns/Status)' },
    { id: 'view_all_stats', label: 'View Master Analytics' },
    { id: 'clear_leads', label: 'Clear System Leads' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    fetch(`${API_BASE}/api/users?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => setAdminUsersList(data))
      .catch(err => console.error(err));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName, password: newUserPassword, jobTitles: newUserJobTitles, abilities: newUserAbilities })
      });
      const data = await res.json();
      if (!res.ok) {
        setNewUserError(data.error || 'Failed to create user');
      } else {
        setNewUserName('');
        setNewUserPassword('');
        setNewUserJobTitles([]);
        setNewUserAbilities([]);
        setNewUserError('');
        fetchUsers();
      }
    } catch (err) {
      setNewUserError('Network error');
    }
  };

  const handleDeleteUser = async (name) => {
    if (!window.confirm(`Are you sure you want to completely revoke access for ${name}?`)) return;
    try {
      await fetch(`${API_BASE}/api/users/${name}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (name) => {
    const newPass = prompt(`Enter new temporary password for ${name}:`);
    if (!newPass) return;
    try {
      await fetch(`${API_BASE}/api/users/${name}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPass })
      });
      alert(`Password for ${name} reset successfully.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserConfigChange = async (name, config) => {
    try {
      await fetch(`${API_BASE}/api/users/${name}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = currentUserData?.abilities?.includes('super_admin') 
               || currentUserData?.abilities?.includes('manage_settings') 
               || currentUserRole === 'admin' 
               || currentUserRole === 'super_admin';

  if (!isAdmin) {
    return <div style={{ padding: '2rem', color: '#ef4444' }}>Unauthorized access. System Settings are restricted to administrators.</div>;
  }

  return (
    <div style={{ display: 'flex', height: '100%', color: 'var(--text-primary)' }}>
      {/* Settings Sidebar */}
      <div style={{ width: '250px', background: 'var(--bg-surface)', borderRight: '1px solid var(--border-color)', padding: '2rem 1rem' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.2rem', paddingLeft: '0.5rem' }}>⚙️ System Settings</h2>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>
            <button 
              onClick={() => setActiveTab('users')}
              style={{ width: '100%', textAlign: 'left', padding: '0.8rem 1rem', background: activeTab === 'users' ? 'var(--bg-surface-hover)' : 'transparent', color: activeTab === 'users' ? '#3b82f6' : 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === 'users' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>👥</span> Access & Roles
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('statuses')}
              style={{ width: '100%', textAlign: 'left', padding: '0.8rem 1rem', background: activeTab === 'statuses' ? 'var(--bg-surface-hover)' : 'transparent', color: activeTab === 'statuses' ? '#10b981' : 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === 'statuses' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>⚙️</span> Status Flows
            </button>
          </li>
          <li>
            <button 
              onClick={() => setActiveTab('columns')}
              style={{ width: '100%', textAlign: 'left', padding: '0.8rem 1rem', background: activeTab === 'columns' ? 'var(--bg-surface-hover)' : 'transparent', color: activeTab === 'columns' ? '#8b5cf6' : 'var(--text-primary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === 'columns' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>📊</span> Form Columns
            </button>
          </li>
        </ul>
      </div>

      {/* Settings Content Area */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        {activeTab === 'users' && (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ margin: 0 }}>Active Directory</h2>
              <span style={{ background: 'var(--bg-surface-hover)', padding: '0.4rem 1rem', borderRadius: '999px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>{adminUsersList.length} Active Accounts</span>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span>➕</span> Provision New Employee</h3>
              <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Full Name</label>
                    <input required value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="e.g. Jane Smith" style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Initial Password</label>
                    <input required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="password" placeholder="Password" style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Job Titles (Select Multiple)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {JOB_TITLES.map(title => (
                      <label key={title} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'var(--bg-surface-hover)', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                        <input 
                          type="checkbox" 
                          checked={newUserJobTitles.includes(title)}
                          onChange={(e) => {
                            if (e.target.checked) setNewUserJobTitles([...newUserJobTitles, title]);
                            else setNewUserJobTitles(newUserJobTitles.filter(t => t !== title));
                          }}
                        />
                        {title}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Super Abilities & Permissions</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {ABILITIES.map(ability => (
                      <label key={ability.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '0.85rem' }}>
                        <input 
                          type="checkbox" 
                          checked={newUserAbilities.includes(ability.id)}
                          onChange={(e) => {
                            if (e.target.checked) setNewUserAbilities([...newUserAbilities, ability.id]);
                            else setNewUserAbilities(newUserAbilities.filter(a => a !== ability.id));
                          }}
                        />
                        {ability.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={{ padding: '0.8rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Create Employee Account</button>
                </div>
              </form>
              {newUserError && <div style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem' }}>{newUserError}</div>}
            </div>

            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-surface-hover)' }}>
                  <tr>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Employee Name</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Job Titles & Config</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Security Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsersList.map(u => (
                    <React.Fragment key={u._id}>
                      <tr style={{ borderBottom: editingUser === u.name ? 'none' : '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            {u.name}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
                            {u.jobTitles && u.jobTitles.map(t => <span key={t} style={{ fontSize: '0.75rem', background: '#374151', color: '#e5e7eb', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>{t}</span>)}
                            {(!u.jobTitles || u.jobTitles.length === 0) && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No Titles</span>}
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {u.abilities && u.abilities.map(a => <span key={a} style={{ fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>{a}</span>)}
                            {(!u.abilities || u.abilities.length === 0) && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>No Super Abilities</span>}
                          </div>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingUser(editingUser === u.name ? null : u.name)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{editingUser === u.name ? 'Close Config' : 'Edit Config'}</button>
                            <button onClick={() => handleResetPassword(u.name)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Reset Pass</button>
                            <button onClick={() => handleDeleteUser(u.name)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Revoke</button>
                          </div>
                        </td>
                      </tr>
                      {editingUser === u.name && (
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
                          <td colSpan="3" style={{ padding: '1.5rem' }}>
                            <div style={{ marginBottom: '1rem' }}>
                              <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assign Job Titles</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {JOB_TITLES.map(title => {
                                  const isChecked = u.jobTitles && u.jobTitles.includes(title);
                                  return (
                                    <label key={title} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: isChecked ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-surface)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', border: `1px solid ${isChecked ? '#3b82f6' : 'var(--border-color)'}`, fontSize: '0.8rem' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const newTitles = e.target.checked 
                                            ? [...(u.jobTitles || []), title] 
                                            : (u.jobTitles || []).filter(t => t !== title);
                                          handleUserConfigChange(u.name, { jobTitles: newTitles });
                                        }}
                                      />
                                      {title}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                            <div>
                              <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Assign Super Abilities</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {ABILITIES.map(ability => {
                                  const isChecked = u.abilities && u.abilities.includes(ability.id);
                                  return (
                                    <label key={ability.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: isChecked ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-surface)', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', border: `1px solid ${isChecked ? '#10b981' : 'var(--border-color)'}`, fontSize: '0.8rem' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={(e) => {
                                          const newAbilities = e.target.checked 
                                            ? [...(u.abilities || []), ability.id] 
                                            : (u.abilities || []).filter(a => a !== ability.id);
                                          handleUserConfigChange(u.name, { abilities: newAbilities });
                                        }}
                                      />
                                      {ability.label}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'statuses' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Status Flow Editor</h2>
            <StatusManager currentUserRole={currentUserRole} currentUser={currentUser} currentUserData={currentUserData} />
          </div>
        )}

        {activeTab === 'columns' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>DMS Column Setup</h2>
            <ColumnManager currentUserRole={currentUserRole} currentUser={currentUser} currentUserData={currentUserData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
