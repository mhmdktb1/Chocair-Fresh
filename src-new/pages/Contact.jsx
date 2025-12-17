import React from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import './Contact.css';

const ContactInfo = ({ icon: Icon, title, content }) => (
  <div className="contact-info-item">
    <div className="contact-icon">
      <Icon size={24} />
    </div>
    <div className="contact-details">
      <h3>{title}</h3>
      <p>{content}</p>
    </div>
  </div>
);

const Contact = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Message sent! We will get back to you soon.');
  };

  return (
    <div className="contact-page">
      <Navbar />
      
      <div className="contact-header">
        <div className="container">
          <h1 className="contact-title">Get in Touch</h1>
          <p className="contact-subtitle">Have questions? We'd love to hear from you.</p>
        </div>
      </div>

      <div className="container contact-container">
        <div className="contact-grid">
          {/* Contact Info Side */}
          <div className="contact-info-wrapper">
            <h2 className="info-title">Contact Information</h2>
            <p className="info-desc">
              Fill up the form and our team will get back to you within 24 hours.
            </p>
            
            <div className="info-list">
              <ContactInfo 
                icon={Phone} 
                title="Phone" 
                content="+1 (555) 123-4567" 
              />
              <ContactInfo 
                icon={Mail} 
                title="Email" 
                content="hello@chocairfresh.com" 
              />
              <ContactInfo 
                icon={MapPin} 
                title="Address" 
                content="123 Green Valley Road, Organic City, CA 90210" 
              />
              <ContactInfo 
                icon={Clock} 
                title="Working Hours" 
                content="Mon - Sat: 8:00 AM - 8:00 PM" 
              />
            </div>

            <div className="social-links">
              {/* Social icons could go here */}
            </div>
          </div>

          {/* Contact Form Side */}
          <div className="contact-form-wrapper">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" placeholder="John Doe" required />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" placeholder="john@example.com" required />
              </div>
              
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input type="text" id="subject" placeholder="How can we help?" required />
              </div>
              
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" rows="5" placeholder="Your message here..." required></textarea>
              </div>
              
              <Button variant="primary" type="submit" className="submit-btn">
                Send Message <Send size={18} style={{ marginLeft: '8px' }} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
