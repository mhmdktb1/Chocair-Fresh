import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, 
  ShoppingBag, 
  Users, 
  LogOut, 
  Menu, 
  X, 
  Grid3x3, 
  Home, 
  MessageSquare, 
  TrendingUp, 
  ExternalLink,
  Store,
  ChevronRight,
  Bell,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './AdminDashboard.css';
import AdminOverview from './AdminOverview';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminUsers from './AdminUsers';
import AdminCategories from './AdminCategories';
import AdminComments from './AdminComments';
import HomeEditor from '../../components/admin/HomeEditor';
import Loading from '../../components/common/Loading';
import { useAuth } from '../../context/AuthContext';
import { useAdmin } from '../../context/AdminContext';

const AdminDashboard = () => {
  // Focus on productivity: Default tab is "orders"
  const [activeTab, setActiveTab] = useState("orders");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const notifMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading, logout } = useAuth();
  const { 
    orders, 
    products, 
    categories, 
    users,
    soundEnabled,
    toggleSound,
    desktopNotifEnabled,
    toggleDesktopNotif,
    notificationPermission,
    requestDesktopNotification,
    testNotificationSound,
    newOrderAlert,
    clearNewOrderAlert
  } = useAdmin();

  // Allow URL hash or search param to set initial tab if provided
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['orders', 'products', 'categories', 'users', 'analytics', 'comments', 'homepage'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Close notification popover when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
    };
    if (notifMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifMenuOpen]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login');
      } else if (!isAdmin) {
        navigate('/');
      }
    }
  }, [loading, user, isAdmin, navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) return <Loading text="Loading admin hub..." />;
  if (!isAdmin) return null;

  // Real-time badge counts for high-speed admin awareness
  const pendingOrdersCount = orders?.filter(o => o.status === "Pending")?.length || 0;
  const totalProductsCount = products?.length || 0;
  const totalUsersCount = users?.length || 0;

  const tabs = [
    { 
      id: "orders", 
      label: "Orders", 
      icon: ShoppingBag, 
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} new` : null,
      badgeColor: 'badge-orange'
    },
    { 
      id: "products", 
      label: "Products", 
      icon: Package,
      badge: totalProductsCount > 0 ? `${totalProductsCount}` : null,
      badgeColor: 'badge-gray'
    },
    { 
      id: "categories", 
      label: "Categories", 
      icon: Grid3x3,
      badge: categories?.length ? `${categories.length}` : null,
      badgeColor: 'badge-gray'
    },
    { 
      id: "users", 
      label: "Users", 
      icon: Users,
      badge: totalUsersCount > 0 ? `${totalUsersCount}` : null,
      badgeColor: 'badge-gray'
    },
    { 
      id: "analytics", 
      label: "Analytics", 
      icon: TrendingUp 
    },
    { 
      id: "comments", 
      label: "Comments", 
      icon: MessageSquare 
    },
    { 
      id: "homepage", 
      label: "Store CMS", 
      icon: Home 
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "orders": return <AdminOrders />;
      case "products": return <AdminProducts />;
      case "categories": return <AdminCategories />;
      case "users": return <AdminUsers />;
      case "analytics": return <AdminOverview />;
      case "comments": return <AdminComments />;
      case "homepage": return <HomeEditor />;
      default: return <AdminOrders />;
    }
  };

  const activeTabObj = tabs.find(t => t.id === activeTab) || tabs[0];

  return (
    <div className="admin-layout">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="admin-backdrop" 
          onClick={() => setSidebarOpen(false)} 
          aria-hidden="true" 
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-dot"></span>
            <h2>Choucair <span className="highlight">Admin</span></h2>
          </div>
          <button 
            className="close-sidebar-btn" 
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Quick view store link */}
        <div className="sidebar-store-link">
          <button 
            type="button" 
            className="store-shortcut-btn" 
            onClick={() => navigate('/')}
          >
            <Store size={18} />
            <span>Open Live Store</span>
            <ExternalLink size={14} className="shortcut-icon" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">OPERATIONS</div>
          {tabs.slice(0, 4).map((tab) => {
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
                <Icon size={19} />
                <span className="nav-item-label">{tab.label}</span>
                {tab.badge && (
                  <span className={`nav-item-badge ${tab.badgeColor || ''}`}>
                    {tab.badge}
                  </span>
                )}
                <ChevronRight size={16} className="nav-item-arrow" />
              </button>
            );
          })}

          <div className="nav-section-label" style={{ marginTop: '1.25rem' }}>INSIGHTS & CMS</div>
          {tabs.slice(4).map((tab) => {
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
                <Icon size={19} />
                <span className="nav-item-label">{tab.label}</span>
                <ChevronRight size={16} className="nav-item-arrow" />
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user-pill">
            <div className="admin-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="admin-user-info">
              <span className="admin-user-name">{user?.name || 'Administrator'}</span>
              <span className="admin-user-role">Super Admin</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        {/* Sticky Mobile & Desktop Top Bar Container */}
        <div className="admin-top-bar-container">
          {/* Row 1: Top Navigation & Title Bar */}
          <header className="admin-header">
            <div className="admin-header-left">
              <button 
                className="menu-toggle-btn" 
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={20} />
                {pendingOrdersCount > 0 && (
                  <span className="menu-badge-dot" />
                )}
              </button>
              <div className="header-title-block">
                <span className="header-badge">MANAGEMENT HUB</span>
                <h1>{activeTabObj.label}</h1>
              </div>
            </div>

            <div className="header-right">
              {/* Sound & Notifications Hub Menu */}
              <div className="admin-notif-hub-wrapper" ref={notifMenuRef}>
                <button
                  type="button"
                  className={`admin-notif-toggle-btn ${soundEnabled ? 'sound-on' : 'sound-off'} ${pendingOrdersCount > 0 ? 'has-pending' : ''}`}
                  onClick={() => setNotifMenuOpen(prev => !prev)}
                  title="Order Notification & Sound Alerts"
                  aria-label="Order Notification Settings"
                >
                  <Bell size={18} />
                  {soundEnabled ? (
                    <span className="notif-sound-indicator" title="Audio alerts active">
                      <Volume2 size={11} />
                    </span>
                  ) : (
                    <span className="notif-sound-indicator muted" title="Audio alerts muted">
                      <VolumeX size={11} />
                    </span>
                  )}
                  {pendingOrdersCount > 0 && (
                    <span className="notif-badge-pill">{pendingOrdersCount}</span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {notifMenuOpen && (
                  <div className="admin-notif-dropdown">
                    <div className="notif-dropdown-header">
                      <div className="notif-header-title">
                        <Bell size={16} />
                        <h4>Live Order Alerts</h4>
                      </div>
                      <span className="live-status-pill">
                        <span className="live-dot"></span>
                        Live Sync
                      </span>
                    </div>

                    <div className="notif-dropdown-body">
                      {/* Sound Toggle Row */}
                      <div className="notif-setting-row">
                        <div className="setting-info">
                          <div className="setting-label-group">
                            {soundEnabled ? <Volume2 size={16} className="setting-icon active" /> : <VolumeX size={16} className="setting-icon" />}
                            <span className="setting-title">Order Sound Chime</span>
                          </div>
                          <span className="setting-sub">Play audio chime when new orders arrive</span>
                        </div>
                        <button 
                          type="button" 
                          className={`switch-toggle ${soundEnabled ? 'checked' : ''}`}
                          onClick={() => toggleSound()}
                          aria-label="Toggle sound alerts"
                        >
                          <span className="switch-slider" />
                        </button>
                      </div>

                      {/* Test Sound Button */}
                      <div className="notif-action-row">
                        <button
                          type="button"
                          className="test-sound-btn"
                          onClick={() => testNotificationSound()}
                        >
                          <Play size={14} />
                          <span>Test Chime Sound</span>
                        </button>
                      </div>

                      <div className="notif-divider" />

                      {/* Desktop Notifications Row */}
                      <div className="notif-setting-row">
                        <div className="setting-info">
                          <div className="setting-label-group">
                            <Bell size={16} className="setting-icon" />
                            <span className="setting-title">Desktop Notifications</span>
                          </div>
                          <span className="setting-sub">
                            {notificationPermission === 'granted' 
                              ? 'Browser notifications enabled' 
                              : notificationPermission === 'denied'
                              ? 'Notifications blocked by browser'
                              : 'Alert when window is in background'}
                          </span>
                        </div>
                        {notificationPermission === 'granted' ? (
                          <span className="perm-status-granted">
                            <CheckCircle2 size={16} color="#16a34a" />
                          </span>
                        ) : notificationPermission === 'denied' ? (
                          <span className="perm-status-denied" title="Blocked in browser permissions">
                            <AlertCircle size={16} color="#ef4444" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="enable-perm-btn"
                            onClick={() => requestDesktopNotification()}
                          >
                            Enable
                          </button>
                        )}
                      </div>

                      {/* Pending Orders summary button */}
                      {pendingOrdersCount > 0 && (
                        <button
                          type="button"
                          className="view-pending-shortcut"
                          onClick={() => {
                            setActiveTab('orders');
                            setNotifMenuOpen(false);
                          }}
                        >
                          <span>{pendingOrdersCount} Pending Order{pendingOrdersCount > 1 ? 's' : ''} awaiting review</span>
                          <ChevronRight size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button 
                className="header-view-store-btn"
                onClick={() => navigate('/')}
                title="View Customer Shop"
                aria-label="View Customer Live Store"
              >
                <Store size={18} />
                <span className="store-text">Live Store</span>
              </button>
              <div className="admin-profile-chip">
                <div className="avatar-small">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </div>
              </div>
            </div>
          </header>

          {/* Row 2: Mobile Quick-Action Navigation Tabs */}
          <nav className="admin-mobile-tabs-bar" aria-label="Admin navigation tabs">
            <div className="mobile-tabs-scroll">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    className={`mobile-tab-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={15} className="mobile-tab-icon" />
                    <span className="mobile-tab-text">{tab.label}</span>
                    {tab.badge && (
                      <span className={`mobile-tab-badge ${tab.badgeColor || ''}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Live New Order Alert Toast Banner */}
        {newOrderAlert && (
          <div className="admin-live-order-banner">
            <div className="live-banner-left">
              <span className="live-beacon-pulse"></span>
              <div className="live-banner-info">
                <span className="live-banner-tag">JUST ARRIVED</span>
                <p className="live-banner-title">
                  New Order <strong>#{String(newOrderAlert.id).slice(-6).toUpperCase()}</strong> from <strong>{newOrderAlert.customer}</strong> (${Number(newOrderAlert.total || 0).toFixed(2)})
                </p>
              </div>
            </div>
            <div className="live-banner-actions">
              <button 
                type="button" 
                className="live-banner-view-btn"
                onClick={() => {
                  setActiveTab('orders');
                  clearNewOrderAlert();
                }}
              >
                Open Orders
              </button>
              <button 
                type="button" 
                className="live-banner-close-btn"
                onClick={clearNewOrderAlert}
                aria-label="Dismiss banner"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Admin Body Content */}
        <div className="admin-content-wrapper">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
