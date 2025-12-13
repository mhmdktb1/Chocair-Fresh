import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import Header from "../components/layout/Header";
import "../styles/checkout.css"; // Reusing checkout styles for simplicity

function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId } = location.state || {};

  useEffect(() => {
    if (!orderId) {
      navigate('/');
    }
  }, [orderId, navigate]);

  return (
    <>
      <Header />
      <div className="checkout-container" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <CheckCircle size={64} color="#4CAF50" />
          <h1 style={{ fontSize: '2.5rem', color: '#2c3e50' }}>Order Placed Successfully!</h1>
          <p style={{ fontSize: '1.2rem', color: '#666' }}>
            Thank you for your purchase. Your order ID is: <strong>{orderId}</strong>
          </p>
          <p>We will contact you shortly to confirm your delivery.</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button 
              onClick={() => navigate('/products')} 
              className="btn-primary"
            >
              Continue Shopping
            </button>
            <button 
              onClick={() => navigate('/account')} 
              className="btn-secondary"
              style={{ 
                padding: '0.75rem 1.5rem', 
                border: '1px solid #ddd', 
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              View My Orders
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default OrderSuccess;