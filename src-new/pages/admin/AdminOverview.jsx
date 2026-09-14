import { useAdmin } from "../../context/AdminContext";
import { 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Truck,
  XCircle,
  Activity
} from "lucide-react";
import './AdminComponents.css';

function AdminOverview() {
  const { getStats, orders } = useAdmin();
  const stats = getStats();

  const statCards = [
    { label: "Total Revenue", value: `$${(stats.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: "#16a34a", bg: "#f0fdf4" },
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "#0284c7", bg: "#e0f2fe" },
    { label: "Total Products", value: stats.totalProducts, icon: Package, color: "#7c3aed", bg: "#f5f3ff" },
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#ea580c", bg: "#ffedd5" },
  ];

  const totalOrdersCount = stats.totalOrders || 1;
  const pendingPct = Math.round((stats.pendingOrders / totalOrdersCount) * 100) || 0;
  const preparingPct = Math.round((stats.preparingOrders / totalOrdersCount) * 100) || 0;
  const deliveredPct = Math.round((stats.deliveredOrders / totalOrdersCount) * 100) || 0;

  return (
    <div className="admin-analytics-page">
      <div className="admin-page-header">
        <div className="admin-page-title-group">
          <h2>Store Analytics & Performance</h2>
          <p className="admin-page-subtitle">
            Real-time sales, order breakdown, and catalog health metrics
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.85rem',
        marginBottom: '1.25rem'
      }}>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.1rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                  {stat.label}
                </span>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: stat.bg,
                  color: stat.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Status Breakdown with Progress Bars */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '14px',
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        marginBottom: '1.25rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} color="#16a34a" />
          <span>Fulfillment Status Pipeline</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ background: '#ffedd5', padding: '0.85rem', borderRadius: '10px', border: '1px solid #fed7aa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c2410c', fontSize: '0.82rem', fontWeight: 700 }}>
              <Clock size={14} /> Pending
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c2410c', marginTop: '0.35rem' }}>
              {stats.pendingOrders}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#9a3412', marginTop: '0.15rem' }}>
              {pendingPct}% of orders
            </div>
          </div>

          <div style={{ background: '#e0f2fe', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bae6fd' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369a1', fontSize: '0.82rem', fontWeight: 700 }}>
              <Truck size={14} /> Preparing
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0369a1', marginTop: '0.35rem' }}>
              {stats.preparingOrders}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#075985', marginTop: '0.15rem' }}>
              {preparingPct}% of orders
            </div>
          </div>

          <div style={{ background: '#dcfce7', padding: '0.85rem', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803d', fontSize: '0.82rem', fontWeight: 700 }}>
              <CheckCircle size={14} /> Delivered
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', marginTop: '0.35rem' }}>
              {stats.deliveredOrders}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: '0.15rem' }}>
              {deliveredPct}% of orders
            </div>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div style={{
          height: '10px',
          width: '100%',
          background: '#f1f5f9',
          borderRadius: '20px',
          overflow: 'hidden',
          display: 'flex',
          gap: '2px'
        }}>
          <div style={{ width: `${pendingPct}%`, background: '#ea580c', transition: 'width 0.4s ease' }} title={`Pending: ${pendingPct}%`} />
          <div style={{ width: `${preparingPct}%`, background: '#0284c7', transition: 'width 0.4s ease' }} title={`Preparing: ${preparingPct}%`} />
          <div style={{ width: `${deliveredPct}%`, background: '#16a34a', transition: 'width 0.4s ease' }} title={`Delivered: ${deliveredPct}%`} />
        </div>
      </div>
    </div>
  );
}

export default AdminOverview;
