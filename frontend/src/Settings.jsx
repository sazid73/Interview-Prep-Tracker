import React, { useState, useEffect } from 'react';
import StatusManager from './StatusManager';
import ColumnManager from './ColumnManager';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Settings = ({ currentUserRole }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [adminUsersList, setAdminUsersList] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('recruiter');
  const [newUserError, setNewUserError] = useState('');

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
      const res = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName, password: newUserPassword, role: newUserRole })
      });
      const data = await res.json();
      if (!res.ok) {
        setNewUserError(data.error || 'Failed to create user');
      } else {
        setNewUserName('');
        setNewUserPassword('');
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

  const handleRoleChange = async (name, newRole) => {
    try {
      await fetch(`${API_BASE}/api/users/${name}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (currentUserRole !== 'admin' && currentUserRole !== 'super_admin') {
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
              <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Full Name</label>
                  <input required value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="e.g. Jane Smith" style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Initial Password</label>
                  <input required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="password" placeholder="Password" style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>System Role</label>
                  <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                    <option value="super_admin">Super Admin (Full Access)</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager / Team Lead</option>
                    <option value="recruiter">Senior Recruiter</option>
                    <option value="chaser">Chaser</option>
                    <option value="standard">Standard User</option>
                  </select>
                </div>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', height: '42px' }}>Create</button>
              </form>
              {newUserError && <div style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem' }}>{newUserError}</div>}
            </div>

            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-surface-hover)' }}>
                  <tr>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Employee Name</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Role</th>
                    <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'right' }}>Security Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsersList.map(u => (
                    <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          {u.name}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select
                          value={u.role || 'standard'}
                          onChange={(e) => handleRoleChange(u.name, e.target.value)}
                          style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '0.9rem' }}
                        >
                          <option value="super_admin">Super Admin</option>
                          <option value="manager">Manager / Team Lead</option>
                          <option value="compliance">Compliance & QA</option>
                          <option value="recruiter">Senior Recruiter</option>
                          <option value="admin">Legacy Admin</option>
                          <option value="standard">Standard User</option>
                          <option value="viewer">Read-Only</option>
                        </select>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleResetPassword(u.name)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Reset Pass</button>
                          <button onClick={() => handleDeleteUser(u.name)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Revoke</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'statuses' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>Status Flow Editor</h2>
            <StatusManager />
          </div>
        )}

        {activeTab === 'columns' && (
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '2rem' }}>DMS Column Setup</h2>
            <ColumnManager />
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
