'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

type User = {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
};

export default function UsersPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'user'>('user');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: newEmail,
      password: newPassword,
      email_confirm: true,
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    if (authData.user) {
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: newEmail,
          role: newRole,
        });

      if (insertError) {
        setError(insertError.message);
      } else {
        setSuccess('User berhasil ditambahkan!');
        setNewEmail('');
        setNewPassword('');
        setNewRole('user');
        setShowAddModal(false);
        fetchUsers();
      }
    }

    setSubmitting(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;

    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      setError(error.message);
    } else {
      setSuccess('User berhasil dihapus!');
      fetchUsers();
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user') => {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Role berhasil diupdate!');
      fetchUsers();
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <Link href="/admin" style={{ color: '#6365b9', textDecoration: 'none', marginBottom: '8px', display: 'block' }}>
            ← Kembali ke Dashboard
          </Link>
          <h1 style={{ fontSize: '32px' }}>User Management</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            background: '#6365b9',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          + Tambah User
        </button>
      </div>

      {error && <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ padding: '12px', background: '#efe', color: '#060', borderRadius: '8px', marginBottom: '16px' }}>{success}</div>}

      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500 }}>Email</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500 }}>Role</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 500 }}>Created</th>
              <th style={{ padding: '16px', textAlign: 'right', fontWeight: 500 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px' }}>{user.email}</td>
                <td style={{ padding: '16px' }}>
                  <select
                    value={user.role}
                    onChange={(e) => handleUpdateRole(user.id, e.target.value as 'admin' | 'user')}
                    style={{
                      padding: '8px 12px',
                      background: user.role === 'admin' ? 'rgba(99, 101, 185, 0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '6px',
                      color: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={{ padding: '16px', color: '#888' }}>
                  {new Date(user.created_at).toLocaleDateString('id-ID')}
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      color: '#ff6b6b',
                      border: '1px solid #ff6b6b',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Hapus
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
                  Tidak ada user
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#1a1a2e',
            padding: '32px',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '400px',
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Tambah User</h2>
            <form onSubmit={handleAddUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'user')}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#6365b9',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Menambah...' : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        a {
          color: #6365b9;
        }
      `}</style>
    </div>
  );
}
