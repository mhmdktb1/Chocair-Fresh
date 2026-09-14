import { useState, useMemo } from "react";
import { useAdmin } from "../../context/AdminContext";
import { 
  Search, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  ShoppingBag, 
  MapPin, 
  MessageCircle, 
  Users, 
  X,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import './AdminComponents.css';

function AdminUsers() {
  const { users, deleteUser } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = !q || u.name?.toLowerCase().includes(q);
      const emailMatch = !q || u.email?.toLowerCase().includes(q);
      const phoneMatch = !q || u.phone?.includes(q);
      const matchesSearch = nameMatch || emailMatch || phoneMatch;

      const matchesRole = roleFilter === "all" || 
        (roleFilter === "admin" && u.role === "Admin") ||
        (roleFilter === "customer" && u.role !== "Admin");

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const handleDeleteUser = (id, name) => {
    if (window.confirm(`Are you sure you want to remove user "${name}"?`)) {
      deleteUser(id);
    }
  };

  const getWhatsAppLink = (user) => {
    if (!user.phone) return null;
    const cleanPhone = user.phone.replace(/[^0-9+]/g, '');
    const text = encodeURIComponent(`Hello ${user.name || 'Customer'}, this is Chocair Fresh customer care.`);
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="admin-users-page">
      {/* Top Header */}
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h2>Customer & User Directory</h2>
          <p className="admin-page-subtitle">
            {filteredUsers.length} of {users.length} registered accounts
          </p>
        </div>
      </div>

      {/* Search & Role Filter Card */}
      <div className="admin-search-filter-card">
        <div className="admin-search-input-wrap">
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search users by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="admin-filter-scroll-row">
          <button
            className={`filter-pill ${roleFilter === "all" ? "active" : ""}`}
            onClick={() => setRoleFilter("all")}
          >
            <span>All Users</span>
            <span className="filter-pill-count">{users.length}</span>
          </button>
          <button
            className={`filter-pill ${roleFilter === "customer" ? "active" : ""}`}
            onClick={() => setRoleFilter("customer")}
          >
            <span>Customers</span>
            <span className="filter-pill-count">{users.filter(u => u.role !== "Admin").length}</span>
          </button>
          <button
            className={`filter-pill ${roleFilter === "admin" ? "active" : ""}`}
            onClick={() => setRoleFilter("admin")}
          >
            <span>Admins</span>
            <span className="filter-pill-count">{users.filter(u => u.role === "Admin").length}</span>
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="admin-users-list">
        {filteredUsers.length === 0 ? (
          <div className="admin-empty-state" style={{ gridColumn: '1 / -1' }}>
            <Users size={40} color="#cbd5e1" />
            <h4>No users found</h4>
            <p>Try searching with another keyword or resetting filters.</p>
          </div>
        ) : (
          filteredUsers.map((user) => {
            const waLink = getWhatsAppLink(user);
            const isAdmin = user.role === "Admin";

            return (
              <div key={user.id} className="admin-user-card">
                <div className="user-card-top">
                  <div className="user-avatar-circle" style={isAdmin ? { background: 'linear-gradient(135deg, #c2410c, #ea580c)' } : {}}>
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="user-card-header-info">
                    <h3 className="user-card-name">{user.name || 'Anonymous User'}</h3>
                    <span className={`user-role-badge ${isAdmin ? 'role-admin' : 'role-customer'}`}>
                      {isAdmin ? '🛡️ Admin' : '👤 Customer'}
                    </span>
                  </div>
                </div>

                <div className="user-contact-details">
                  {user.phone && (
                    <div className="user-contact-item">
                      <Phone size={14} color="#64748b" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.email && (
                    <div className="user-contact-item">
                      <Mail size={14} color="#64748b" />
                      <span>{user.email}</span>
                    </div>
                  )}
                  {user.location && user.location !== "Unknown" && (
                    <div className="user-contact-item">
                      <MapPin size={14} color="#64748b" />
                      <span>{user.location.startsWith('Lat:') ? 'GPS Pinned Location' : user.location}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem', paddingTop: '0.35rem', borderTop: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      <strong>{user.orders || 0}</strong> orders placed
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#16a34a' }}>
                      ${Number(user.totalSpent || 0).toFixed(2)} spent
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="order-card-actions">
                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="action-btn action-btn-whatsapp"
                      title="WhatsApp Customer"
                    >
                      <MessageCircle size={15} />
                      <span>WhatsApp</span>
                    </a>
                  )}

                  {user.phone && (
                    <a
                      href={`tel:${user.phone}`}
                      className="action-btn action-btn-call"
                      title="Call Phone"
                    >
                      <Phone size={15} />
                      <span>Call</span>
                    </a>
                  )}

                  <button
                    className="action-btn action-btn-delete"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    title="Remove User"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
