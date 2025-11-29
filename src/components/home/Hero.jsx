import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="hero-section">
      <img src="/assets/images/hero.jpg" alt="Hero" className="hero-image" />
      <div className="hero-content">
        <h1>Freshness Delivered To Your Door</h1>
        <p>Order premium fruits and vegetables directly from Chocair Fresh.</p>
  <Link to="/products" className="hero-btn">Shop Now</Link>
      </div>
    </section>
  );
}
export default Hero;
