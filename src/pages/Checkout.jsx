import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/checkout.css";
import { CreditCard, Truck, MapPin, User, Mail, DollarSign, LocateFixed } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    paymentMethod: "card", // "card" or "cash"
  });

  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  // 🌍 Initialize map after component mounts
  useEffect(() => {
    if (window.google && !map) {
      const defaultCenter = { lat: 33.8886, lng: 35.4955 }; // Beirut
      const mapInstance = new window.google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: defaultCenter,
      });

      const newMarker = new window.google.maps.Marker({
        position: defaultCenter,
        map: mapInstance,
        draggable: true,
      });

      const geocoder = new window.google.maps.Geocoder();

      // 📍 When marker is dragged
      newMarker.addListener("dragend", () => {
        geocoder.geocode({ location: newMarker.getPosition() }, (results, status) => {
          if (status === "OK" && results[0]) {
            setFormData((prev) => ({
              ...prev,
              address: results[0].formatted_address,
            }));
          }
        });
      });

      // ✅ Allow click on map to move marker
      mapInstance.addListener("click", (event) => {
        const newPos = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        };
        newMarker.setPosition(newPos);
        mapInstance.panTo(newPos);

        geocoder.geocode({ location: newPos }, (results, status) => {
          if (status === "OK" && results[0]) {
            setFormData((prev) => ({
              ...prev,
              address: results[0].formatted_address,
            }));
          }
        });
      });

      setMap(mapInstance);
      setMarker(newMarker);
    }
  }, [map]);

  // 📍 Use current location button
  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const position = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          if (map && marker) {
            map.setCenter(position);
            marker.setPosition(position);

            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: position }, (results, status) => {
              if (status === "OK" && results[0]) {
                setFormData((prev) => ({
                  ...prev,
                  address: results[0].formatted_address,
                }));
              }
            });
          }
        },
        (err) => {
          alert("⚠️ Could not access your location. Please enable GPS.");
          console.error(err);
        }
      );
    } else {
      alert("Your browser does not support geolocation.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePaymentChange = (method) => {
    setFormData({ ...formData, paymentMethod: method });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.email || !formData.phone || !formData.address || !formData.city) {
      alert("⚠️ Please fill in all required fields.");
      return;
    }

    if (formData.paymentMethod === "card") {
      if (!formData.cardNumber || !formData.expiry || !formData.cvv) {
        alert("⚠️ Please complete card details.");
        return;
      }
    }

    if (cartItems.length === 0) {
      alert("⚠️ Your cart is empty!");
      navigate("/products");
      return;
    }

    // Log order details (Backend integration point)
    console.log("🚀 Order Submitted:", {
      customer: {
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
      },
      delivery: {
        address: formData.address,
        city: formData.city,
      },
      payment: {
        method: formData.paymentMethod,
        ...(formData.paymentMethod === "card" && {
          cardNumber: formData.cardNumber.slice(-4), // Only last 4 digits
        }),
      },
      items: cartItems,
      total: (getCartTotal() + 2.5).toFixed(2),
    });

    // Clear cart and show success
    clearCart();
    alert(
      `✅ Order placed successfully!\n\nTotal: $${(getCartTotal() + 2.5).toFixed(2)}\nPayment: ${
        formData.paymentMethod === "cash" ? "Cash on Delivery" : "Credit Card"
      }\nDelivery: ${formData.address}\n\nYou'll receive confirmation via email.`
    );
    
    navigate("/");
  };

  return (
    <section className="checkout-page">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>

        <div className="checkout-grid">
          {/* Left side - form */}
          <form className="checkout-form" onSubmit={handleSubmit}>
            <h2>Billing Details</h2>

            <div className="form-group">
              <label>
                <User /> Full Name
              </label>
              <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>
                <Mail /> Email
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" placeholder="+961 70 123 456" value={formData.phone} onChange={handleChange} required />
            </div>

            <h2>Delivery Address</h2>

            <div className="form-group">
              <label>
                <MapPin /> Address
              </label>
              <input
                type="text"
                name="address"
                placeholder="Drag the pin or click on map"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            {/* ✅ Button to detect location */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="use-location-btn"
            >
              <LocateFixed /> Use My Current Location
            </button>

            <div id="map" className="map-container"></div>

            <div className="form-group">
              <label>City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Beirut" required />
            </div>

            <h2>Payment Method</h2>
            <div className="payment-options">
              <label className={`payment-option ${formData.paymentMethod === "card" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={() => handlePaymentChange("card")}
                />
                <CreditCard /> Pay by Card
              </label>

              <label className={`payment-option ${formData.paymentMethod === "cash" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === "cash"}
                  onChange={() => handlePaymentChange("cash")}
                />
                <DollarSign /> Cash on Delivery
              </label>
            </div>

            {formData.paymentMethod === "card" && (
              <>
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    required={formData.paymentMethod === "card"}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      name="expiry"
                      placeholder="MM/YY"
                      value={formData.expiry}
                      onChange={handleChange}
                      required={formData.paymentMethod === "card"}
                    />
                  </div>
                  <div className="form-group half">
                    <label>CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      placeholder="123"
                      value={formData.cvv}
                      onChange={handleChange}
                      required={formData.paymentMethod === "card"}
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="place-order-btn">
              <Truck /> Place Order
            </button>
          </form>

          {/* Right side summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            {cartItems.length > 0 ? (
              <>
                {cartItems.map((item) => (
                  <div key={item.id} className="summary-item" style={{ fontSize: '0.9rem', color: '#666' }}>
                    <span>{item.name} × {item.qty} {item.unit || 'item'}{item.qty > 1 ? 's' : ''}</span>
                    <span>${(typeof item.price === 'string' ? parseFloat(item.price.replace('$', '')) * item.qty : item.price * item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <hr style={{ margin: '10px 0', border: 'none', borderTop: '1px solid #eee' }} />
                <div className="summary-item">
                  <span>Subtotal</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="summary-item">
                  <span>Delivery</span>
                  <span>$2.50</span>
                </div>
                <div className="summary-total">
                  <strong>Total</strong>
                  <strong>${(getCartTotal() + 2.5).toFixed(2)}</strong>
                </div>
              </>
            ) : (
              <p style={{ color: '#777', textAlign: 'center', padding: '20px 0' }}>Your cart is empty</p>
            )}
            <p className="summary-note">
              You'll receive your order within 2 hours. We deliver in Beirut & Dbayeh areas. 🌿
            </p>
          </div>
        </div>
      </div>
      {/* Sticky order bar for mobile */}
<div className="sticky-order-bar">
  <div className="sticky-total">
    <span>Total:</span>
    <strong>${(getCartTotal() + 2.5).toFixed(2)}</strong>
  </div>
  <button className="sticky-btn" onClick={handleSubmit}>
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-truck"><path d="M10 17h4v-3H3V5a1 1 0 0 1 1-1h10v3h2l3 3v4h-3v3h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
    Place Order
  </button>
</div>

    </section>
  );
}

export default Checkout;
