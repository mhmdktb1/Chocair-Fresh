import { useAdmin } from "../../context/AdminContext";
import { 
  Package, 
  ShoppingBag, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Truck
} from "lucide-react";
import './AdminComponents.css';

function AdminOverview() {
  const { getStats } = useAdmin();
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
      <div className="admin-stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="admin-stat-card">
              <div className="stat-card-header">
                <span className="stat-card-label">
                  {stat.label}
                </span>
                <div 
                  className="stat-icon-wrap"
                  style={{ background: stat.bg, color: stat.color }}
                >
                  <Icon size={18} />
                </div>
              </div>
              <div className="stat-card-value">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Status Breakdown with Progress Bars */}
      <div className="pipeline-card-container">
        <h3 className="pipeline-header">
          <TrendingUp size={18} color="#16a34a" />
          <span>Fulfillment Status Pipeline</span>
        </h3>

        <div className="pipeline-stages-grid">
          <div className="pipeline-stage-box" style={{ background: '#ffedd5', border: '1px solid #fed7aa' }}>
            <div className="stage-badge-label" style={{ color: '#c2410c' }}>
              <Clock size={14} /> Pending
            </div>
            <div className="stage-count-val" style={{ color: '#c2410c' }}>
              {stats.pendingOrders}
            </div>
            <div className="stage-pct-val" style={{ color: '#9a3412' }}>
              {pendingPct}% of orders
            </div>
          </div>

          <div className="pipeline-stage-box" style={{ background: '#e0f2fe', border: '1px solid #bae6fd' }}>
            <div className="stage-badge-label" style={{ color: '#0369a1' }}>
              <Truck size={14} /> Preparing
            </div>
            <div className="stage-count-val" style={{ color: '#0369a1' }}>
              {stats.preparingOrders}
            </div>
            <div className="stage-pct-val" style={{ color: '#075985' }}>
              {preparingPct}% of orders
            </div>
          </div>

          <div className="pipeline-stage-box" style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
            <div className="stage-badge-label" style={{ color: '#15803d' }}>
              <CheckCircle size={14} /> Delivered
            </div>
            <div className="stage-count-val" style={{ color: '#15803d' }}>
              {stats.deliveredOrders}
            </div>
            <div className="stage-pct-val" style={{ color: '#166534' }}>
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
