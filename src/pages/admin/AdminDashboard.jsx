import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, Menu, X, Image, Grid3x3, Tag } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AdminProvider } from "../../context/AdminContext";
import AdminOverview from "./AdminOverview";
import AdminProducts from "./AdminProducts";
import AdminOrders from "./AdminOrders";
import AdminUsers from "./AdminUsers";
import AdminHero from "./AdminHero";
import AdminCMSCategories from "./AdminCMSCategories";
import AdminOffers from "./AdminOffers";

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  const handleLogout = () => {
    logoutUser();
    console.log("🚪 Admin logged out");
    navigate("/");
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "users", label: "Users", icon: Users },
    { id: "hero", label: "Hero & Banners", icon: Image },
    { id: "categories", label: "Categories", icon: Grid3x3 },
    { id: "offers", label: "Offers", icon: Tag },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminOverview />;
      case "products":
        return <AdminProducts />;
      case "orders":
        return <AdminOrders />;
      case "users":
        return <AdminUsers />;
      case "hero":
        return <AdminHero />;
      case "categories":
        return <AdminCMSCategories />;
      case "offers":
        return <AdminOffers />;
      default:
        return <AdminOverview />;
    }
  };

  return (
    <AdminProvider>
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#f5f5f5',
        fontFamily: 'inherit'
      }}>
        {/* Sidebar */}
        <aside style={{
          width: sidebarOpen ? '260px' : '0',
          background: '#2e7d32',
          color: '#fff',
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          zIndex: 1000,
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
              Chocair <span style={{ color: '#a5d6a7' }}>Admin</span>
            </h2>
          </div>

          <nav style={{ marginTop: '20px' }}>
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none',
                    borderLeft: activeTab === tab.id ? '4px solid #a5d6a7' : '4px solid transparent',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: activeTab === tab.id ? 600 : 400,
                    transition: 'all 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              right: '20px',
              padding: '12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 600,
              transition: 'all 0.3s ease',
              fontFamily: 'inherit'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#c62828';
              e.currentTarget.style.borderColor = '#c62828';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </aside>

        {/* Main Content */}
        <main style={{
          flex: 1,
          marginLeft: sidebarOpen && window.innerWidth >= 768 ? '260px' : '0',
          transition: 'margin-left 0.3s ease'
        }}>
          {/* Top Bar */}
          <header style={{
            background: '#fff',
            padding: '15px 30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  background: '#2e7d32',
                  border: 'none',
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1b5e20'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2e7d32'}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#333', fontWeight: 700 }}>
                {tabs.find(t => t.id === activeTab)?.label || "Dashboard"}
              </h1>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>
              <strong>Admin Panel</strong> • {new Date().toLocaleDateString()}
            </div>
          </header>

          {/* Content Area */}
          <div style={{ padding: '30px' }}>
            {renderContent()}
          </div>
        </main>

        {/* Mobile Overlay */}
        {sidebarOpen && window.innerWidth < 768 && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999
            }}
          />
        )}
      </div>
    </AdminProvider>
  );
}

export default AdminDashboard;
