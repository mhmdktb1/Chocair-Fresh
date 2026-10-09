import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, MessageCircle, Sparkles, Sprout } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useHomeConfig } from '../hooks/useHomeConfig';
import { getStoryContent } from '../utils/storyContent';
import { useSeo } from '../seo/useSeo';
import { aboutSeo } from '../seo/pageSeo';
import { BUSINESS } from '../seo/siteConfig';
import './About.css';

const About = () => {
  useSeo(aboutSeo());
  const homeConfig = useHomeConfig();
  const { lead, body, image, hasCustomImage } = getStoryContent(homeConfig?.story);

  return (
    <div className="about-page">
      <Navbar />

      <section className="about-hero">
        <div className="container">
          <div className="about-hero-badge">
            <Sparkles size={14} />
            <span>Our Story</span>
          </div>
          <h1 className="about-title">About <span className="highlight">Choucair Fresh</span></h1>
          <p className="about-subtitle">
            Choucair Fresh is the online store of {BUSINESS.storeName} in {BUSINESS.address.locality}, {BUSINESS.address.district} &mdash;
            fresh produce, carefully selected and packed for every order.
          </p>
        </div>
      </section>

      <section className="section-story container">
        <div className="story-grid">
          <div className="story-image-wrapper">
            <img
              src={image}
              alt={hasCustomImage ? '' : 'Farmer holding fresh produce'}
              className="story-img"
              loading="lazy"
              decoding="async"
            />
            <div className="story-image-overlay" />
          </div>

          <div className="story-content">
            <div className="story-tag">
              <Sprout size={14} />
              <span>Who We Are</span>
            </div>
            <h2 className="section-title">Our Story</h2>
            <p className="story-text">{lead}</p>
            <p className="story-text">{body}</p>

            <div className="story-btn-row">
              <Link to="/shop" className="story-shop-btn">
                <span>Shop Fresh Produce</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="about-visit container" aria-labelledby="about-visit-title">
        <h2 id="about-visit-title" className="section-title">Visit Our Store</h2>
        <div className="about-visit-grid">
          <div className="about-visit-item">
            <MapPin size={20} aria-hidden="true" />
            <div>
              <strong>{BUSINESS.storeName}</strong>
              <span>{BUSINESS.address.locality}, {BUSINESS.address.district}, {BUSINESS.address.countryName}</span>
            </div>
          </div>
          <div className="about-visit-item">
            <Clock size={20} aria-hidden="true" />
            <div>
              <strong>Opening hours</strong>
              <span>{BUSINESS.openingHours.display}</span>
            </div>
          </div>
          <div className="about-visit-item">
            <MessageCircle size={20} aria-hidden="true" />
            <div>
              <strong>WhatsApp orders &amp; support</strong>
              <a href={BUSINESS.whatsappUrl} target="_blank" rel="noopener noreferrer">{BUSINESS.phoneDisplay}</a>
            </div>
          </div>
        </div>
        <p className="about-visit-more">
          Delivery area, fees and directions are on our <Link to="/contact">contact &amp; delivery page</Link>.
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default About;
