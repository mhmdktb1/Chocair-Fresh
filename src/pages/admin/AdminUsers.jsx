import { useState } from "react";
import { useAdmin } from "../../context/AdminContext";
import { Search, Trash2, Mail, Phone, Calendar, ShoppingBag } from "lucide-react";

function AdminUsers() {
  const { users, deleteUser } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.phone.includes(searchQuery)
  );

  const handleDeleteUser = (id, name) => {
    if (window.confirm(`Are you sure you want to remove user "${name}"?`)) {
      deleteUser(id);
    }
  };

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '25px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#333', fontWeight: 700 }}>
          Users Management
        </h2>
      </div>

      {/* Search Bar */}
      <div style={{
        background: '#fff',
        padding: '15px',
        borderRadius: '12px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <Search size={20} color="#666" />
        <input
          type="text"
          placeholder="Search users by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Users Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {filteredUsers.length === 0 ? (
          <div style={{
            background: '#fff',
            padding: '40px',
            borderRadius: '16px',
            textAlign: 'center',
            color: '#999',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            gridColumn: '1 / -1'
          }}>
            No users found
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
            >
              {/* User Avatar */}
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2e7d32, #66bb6a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '15px',
                margin: '0 auto 15px auto'
              }}>
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* User Info */}
              <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 700, color: '#333', textAlign: 'center' }}>
                {user.name}
              </h3>

              <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Mail size={16} color="#2e7d32" />
                  <span>{user.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Phone size={16} color="#2e7d32" />
                  <span>{user.phone}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Calendar size={16} color="#2e7d32" />
                  <span>Joined: {user.joined}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShoppingBag size={16} color="#2e7d32" />
                  <span><strong>{user.orders}</strong> orders</span>
                </div>
              </div>

              {/* Order Badge */}
              <div style={{
                background: '#e8f5e9',
                color: '#2e7d32',
                padding: '8px',
                borderRadius: '10px',
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '15px'
              }}>
                Total Spent: ${(user.orders * 25.5).toFixed(2)}
              </div>

              {/* Delete Button */}
              <button
                onClick={() => handleDeleteUser(user.id, user.name)}
                style={{
                  width: '100%',
                  background: '#f44336',
                  color: '#fff',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d32f2f'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f44336'}
              >
                <Trash2 size={18} />
                Remove User
              </button>
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      <div style={{
        marginTop: '30px',
        background: '#fff',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#333', fontWeight: 700 }}>
          User Statistics
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#2e7d32' }}>Total Users</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#2e7d32' }}>
              {users.length}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1976d2' }}>Total Orders</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#1976d2' }}>
              {users.reduce((sum, u) => sum + u.orders, 0)}
            </p>
          </div>
          <div style={{ padding: '15px', background: '#f3e5f5', borderRadius: '10px' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#7b1fa2' }}>Avg Orders/User</p>
            <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#7b1fa2' }}>
              {users.length > 0 ? (users.reduce((sum, u) => sum + u.orders, 0) / users.length).toFixed(1) : 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminUsers;
