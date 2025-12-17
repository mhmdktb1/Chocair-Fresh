import { useAdmin } from "../../context/AdminContext";
import { Package, ShoppingBag, Users, DollarSign, TrendingUp, Clock, CheckCircle, Truck } from "lucide-react";

function AdminOverview() {
  const { getStats } = useAdmin();
  const stats = getStats();

  const statCards = [
    { label: "Total Products", value: stats.totalProducts, icon: Package, color: "#2e7d32", bg: "#e8f5e9" },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "#1976d2", bg: "#e3f2fd" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#f57c00", bg: "#fff3e0" },
    { label: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "#7b1fa2", bg: "#f3e5f5" },
  ];

  const orderStats = [
    { label: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: "#f57c00" },
    { label: "Preparing", value: stats.preparingOrders, icon: Truck, color: "#1976d2" },
    { label: "Delivered", value: stats.deliveredOrders, icon: CheckCircle, color: "#2e7d32" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#333', fontWeight: 700 }}>
        Dashboard Overview
      </h2>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '25px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                cursor: 'pointer'
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
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '12px',
                background: stat.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={28} color={stat.color} strokeWidth={2.5} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>
                  {stat.label}
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '1.8rem', fontWeight: 700, color: '#333' }}>
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Statistics */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '25px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        marginBottom: '30px'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#333', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={24} color="#2e7d32" />
          Order Status Breakdown
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          {orderStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                style={{
                  padding: '20px',
                  border: `2px solid ${stat.color}20`,
                  borderRadius: '12px',
                  background: `${stat.color}05`,
                  textAlign: 'center',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = stat.color;
                  e.currentTarget.style.background = `${stat.color}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${stat.color}20`;
                  e.currentTarget.style.background = `${stat.color}05`;
                }}
              >
                <Icon size={32} color={stat.color} style={{ marginBottom: '10px' }} />
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', fontWeight: 500 }}>
                  {stat.label}
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '2rem', fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '25px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.3rem', color: '#333', fontWeight: 700 }}>
          Quick Actions
        </h3>
        <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
          Use the sidebar to navigate between Products, Orders, and Users management sections.
        </p>
      </div>
    </div>
  );
}

export default AdminOverview;
