import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, MessageCircle, Navigation, Phone, Truck } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useHomeConfig } from '../hooks/useHomeConfig';
import { DEFAULT_DELIVERY_CONFIG } from '../utils/distanceHelper';
import { formatCurrency } from '../utils/formatters';
import { useSeo } from '../seo/useSeo';
import { contactSeo } from '../seo/pageSeo';
import { BUSINESS } from '../seo/siteConfig';
import './Contact.css';

const getDeliveryConfig = (homeConfig) => ({
  ...DEFAULT_DELIVERY_CONFIG,
  ...(homeConfig?.delivery || {}),
  distanceTiers: {
    ...DEFAULT_DELIVERY_CONFIG.distanceTiers,
    ...(homeConfig?.delivery?.distanceTiers || {}),
  },
});

const Contact = () => {
  const homeConfig = useHomeConfig();
  const delivery = getDeliveryConfig(homeConfig);
  const radiusKm = Number(delivery.maxDeliveryRadiusKm) || DEFAULT_DELIVERY_CONFIG.maxDeliveryRadiusKm;
  const tiers = delivery.distanceTiers;

  useSeo(contactSeo({ deliveryRadiusKm: radiusKm }));

  const { locality, district, countryName } = BUSINESS.address;

  return (
    <div className="cp-page">
      <Navbar />

      <header className="cp-hero">
        <div className="container">
          <h1 className="cp-title">Contact &amp; Delivery</h1>
          <p className="cp-subtitle">
            Order on the website or message us on WhatsApp. Our store, {BUSINESS.storeName}, is in {locality}, {district}.
          </p>
        </div>
      </header>

      <main className="container cp-main">
        <section className="cp-grid" aria-label="Contact details">
          <article className="cp-card">
            <MessageCircle size={22} className="cp-icon" aria-hidden="true" />
            <h2>WhatsApp &amp; Phone</h2>
            <p>Orders, product questions and delivery updates.</p>
            <div className="cp-actions">
              <a className="cp-btn primary" href={BUSINESS.whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={16} aria-hidden="true" /> WhatsApp {BUSINESS.phoneDisplay}
              </a>
              <a className="cp-btn" href={`tel:${BUSINESS.phoneE164}`}>
                <Phone size={16} aria-hidden="true" /> Call us
              </a>
            </div>
          </article>

          <article className="cp-card">
            <MapPin size={22} className="cp-icon" aria-hidden="true" />
            <h2>Store Location</h2>
            <address className="cp-address">
              <strong>{BUSINESS.storeName}</strong>
              <span>{locality}, {district}, {countryName}</span>
              <span>Plus code: {BUSINESS.plusCode}</span>
            </address>
            <div className="cp-actions">
              <a className="cp-btn" href={BUSINESS.mapsUrl} target="_blank" rel="noopener noreferrer">
                <Navigation size={16} aria-hidden="true" /> Get directions
              </a>
            </div>
          </article>

          <article className="cp-card">
            <Clock size={22} className="cp-icon" aria-hidden="true" />
            <h2>Opening Hours</h2>
            <p className="cp-strong">{BUSINESS.openingHours.display}</p>
            <p>Open every day, including weekends.</p>
          </article>
        </section>

        <section className="cp-delivery" aria-labelledby="cp-delivery-title">
          <div className="cp-delivery-head">
            <Truck size={22} className="cp-icon" aria-hidden="true" />
            <h2 id="cp-delivery-title">Delivery Information</h2>
          </div>
          <p>
            We deliver to addresses within <strong>{radiusKm} km</strong> of our store in {locality}. Pin your exact
            location at checkout to confirm coverage and see your delivery fee before you order.
          </p>

          {delivery.pricingType === 'fixed' ? (
            <ul className="cp-fees">
              <li><span>Delivery fee</span><strong>{formatCurrency(delivery.fixedFee)}</strong></li>
            </ul>
          ) : (
            <ul className="cp-fees">
              <li><span>Under {tiers.tier1MaxKm} km</span><strong>{formatCurrency(tiers.tier1Fee)}</strong></li>
              <li><span>{tiers.tier1MaxKm} &ndash; {tiers.tier2MaxKm} km</span><strong>{formatCurrency(tiers.tier2Fee)}</strong></li>
              <li><span>{tiers.tier2MaxKm} &ndash; {radiusKm} km</span><strong>{formatCurrency(tiers.tier3Fee)}</strong></li>
            </ul>
          )}

          {delivery.freeDeliveryEnabled && Number(delivery.freeDeliveryThreshold) > 0 && (
            <p className="cp-free">
              Free delivery on orders of {formatCurrency(delivery.freeDeliveryThreshold)} or more.
            </p>
          )}

          <Link to="/shop" className="cp-btn primary cp-shop-btn">Start shopping</Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
