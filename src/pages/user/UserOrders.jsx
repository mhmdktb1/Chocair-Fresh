import { useState, useEffect } from "react";
import { get } from "../../utils/api";
import { Package, Clock, CheckCircle, XCircle, ChevronRight } from "lucide-react";
import Header from "../../components/layout/Header";
import "../../styles/accountPage.css"; // Reuse account styles

function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await get('/orders/myorders');
      setOrders(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch your orders.");
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#f39c12';
      case 'Preparing': return '#3498db';
      case 'Delivered': return '#2ecc71';
      case 'Cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <>
      <Header />
      <div className="account-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <h1 style={{ marginBottom: '2rem' }}>My Orders</h1>

        {loading && <p>Loading orders...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {!loading && !error && orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#f9f9f9', borderRadius: '8px' }}>
            <Package size={48} color="#ccc" />
            <p style={{ marginTop: '1rem', color: '#666' }}>You haven't placed any orders yet.</p>
          </div>
        )}

        <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map(order => (
            <div key={order._id} style={{ 
              border: '1px solid #eee', 
              borderRadius: '8px', 
              padding: '1.5rem',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f0f0f0', paddingBottom: '0.5rem' }}>
                <div>
                  <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Order #{order._id.slice(-6).toUpperCase()}</span>
                  <span style={{ marginLeft: '1rem', color: '#888', fontSize: '0.9rem' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '20px', 
                  fontSize: '0.85rem',
                  background: getStatusColor(order.status) + '20',
                  color: getStatusColor(order.status),
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {order.status === 'Delivered' ? <CheckCircle size={14} /> : <Clock size={14} />}
                  {order.status}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {order.orderItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                      <span>{item.name} x {item.qty}</span>
                    </div>
                    <span>${(item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#666' }}>Total Amount</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${order.totalPrice.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default UserOrders;