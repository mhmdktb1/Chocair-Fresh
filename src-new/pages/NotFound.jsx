import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useSeo } from '../seo/useSeo';
import { notFoundSeo } from '../seo/pageSeo';
import './NotFound.css';

const NotFound = () => {
  useSeo(notFoundSeo());

  return (
    <div className="not-found-page">
      <Navbar />
      <main className="not-found-main">
        <p className="not-found-code">404</p>
        <h1 className="not-found-title">Page not found</h1>
        <p className="not-found-text">
          The page you are looking for doesn&rsquo;t exist or may have moved.
        </p>
        <div className="not-found-actions">
          <Link to="/shop" className="not-found-btn primary">Browse the shop</Link>
          <Link to="/" className="not-found-btn">Go to homepage</Link>
          <Link to="/contact" className="not-found-btn">Contact us</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;
