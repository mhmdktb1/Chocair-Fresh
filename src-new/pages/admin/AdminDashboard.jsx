import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, Menu, X, Image, Grid3x3, Tag } from 'lucide-react';
import './AdminDashboard.css';
import AdminOverview from './AdminOverview';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminUsers from './AdminUsers';
import AdminCategories from './AdminCategories';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Implement logout logic here
    navigate("/");
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "categories", label: "Categories", icon: Grid3x3 },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "users", label: "Users", icon: Users },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return <AdminOverview />;
      case "products": return <AdminProducts />;
      case "categories": return <AdminCategories />;
      case "orders": return <AdminOrders />;
      case "users": return <AdminUsers />;
      default: return <AdminOverview />;
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>Chocair<span className="highlight">Admin</span></h2>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
          <div className="admin-profile">
            <div className="avatar">A</div>
            <span>Admin User</span>
          </div>
        </header>

        <div className="admin-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
