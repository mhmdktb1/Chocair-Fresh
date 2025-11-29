import { useNavigate } from "react-router-dom";
import "../styles/cart.css";
import { Trash2, CreditCard, Truck, ArrowLeft } from "lucide-react";
import { useCart } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart();

  const handleRemove = (id) => {
    removeFromCart(id);
  };

  const handleQtyChange = (id, delta) => {
    const item = cartItems.find((item) => item.id === id);
    if (item) {
      updateQuantity(id, item.qty + delta);
    }
  };

  const subtotal = getCartTotal();
  const delivery = subtotal > 0 ? 2.5 : 0;
  const total = subtotal + delivery;

  return (
    <section className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <h1 className="cart-title">Shopping Cart</h1>
        </div>

        {cartItems.length === 0 ? (
          <p className="empty-msg">Your cart is empty 🛒</p>
        ) : (
          <div className="cart-grid">
            {/* Left side: items */}
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.id} className="cart-item">
                  <img src={item.img} alt={item.name} />
                  <div className="cart-details">
                    <h3>{item.name}</h3>
                    <p>
                      ${typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')).toFixed(2) : item.price.toFixed(2)}
                      {item.unit && <span style={{ fontSize: '0.85rem', color: '#666' }}> / {item.unit}</span>}
                    </p>
                    <div className="qty-controls">
                      <button onClick={() => handleQtyChange(item.id, -1)}>-</button>
                      <span>{item.qty} {item.unit || 'item'}{item.qty > 1 ? 's' : ''}</span>
                      <button onClick={() => handleQtyChange(item.id, 1)}>+</button>
                    </div>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
            </div>

            {/* Right side: summary */}
            <div className="cart-summary">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery</span>
                <span>${delivery.toFixed(2)}</span>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <strong>${total.toFixed(2)}</strong>
              </div>

              <button className="checkout-btn" onClick={() => navigate("/checkout")}>
                <CreditCard /> Proceed to Checkout
              </button>

              <div className="summary-info">
                <Truck /> Delivery within 2 hours in Beirut / Dbayeh area
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Cart;
