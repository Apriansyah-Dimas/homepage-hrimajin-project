import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '32px' }}>Admin Dashboard</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        <Link href="/admin/users" style={cardStyle}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>👥</div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>User Management</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>Kelola user dan role</p>
        </Link>
        
        <div style={cardStyle}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⚙️</div>
          <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Settings</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>Pengaturan sistem</p>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  display: 'block',
  padding: '32px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '16px',
  textDecoration: 'none',
  color: 'inherit',
  transition: 'all 0.2s ease',
};
