import React from 'react';
import { Star, Quote } from 'lucide-react';
import './TestimonialsSection.css';

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Health Enthusiast",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    text: "The quality of produce is unmatched. I've never tasted strawberries this sweet from a regular grocery store. Highly recommended!",
    rating: 5
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Chef",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    text: "As a chef, freshness is everything. Chocair Fresh delivers consistent quality that I can rely on for my restaurant's signature dishes.",
    rating: 5
  },
  {
    id: 3,
    name: "Emily Davis",
    role: "Busy Mom",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
    text: "The delivery is always on time, and the packaging is eco-friendly. It makes healthy eating so much easier for my family.",
    rating: 5
  }
];

const TestimonialsSection = () => {
  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="testimonials-header">
          <span className="testimonials-subtitle">Testimonials</span>
          <h2 className="testimonials-title">What Our Customers Say</h2>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((item) => (
            <div key={item.id} className="testimonial-card">
              <div className="quote-icon">
                <Quote size={24} />
              </div>
              <p className="testimonial-text">"{item.text}"</p>
              
              <div className="testimonial-footer">
                <img src={item.image} alt={item.name} className="testimonial-avatar" />
                <div className="testimonial-info">
                  <h4 className="testimonial-name">{item.name}</h4>
                  <span className="testimonial-role">{item.role}</span>
                </div>
                <div className="testimonial-rating">
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#f1c40f" color="#f1c40f" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;