import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { Save, Image as ImageIcon, Type, Layout } from 'lucide-react';
import './HomeEditor.css';

const HomeEditor = () => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    hero: { 
      title: '', 
      subtitle: '', 
      backgroundImage: '',
      stats: [
        { label: '', value: '' },
        { label: '', value: '' },
        { label: '', value: '' }
      ]
    },
    bundle: { title: '', description: '', price: 0, image: '' },
    story: { title: '', subtitle: '', description: '', image: '' },
    featuredCategories: []
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/home-config');
      const data = response.data;
      if (data) {
        // Ensure stats array has 3 items
        if (!data.hero.stats || data.hero.stats.length === 0) {
            data.hero.stats = [
                { label: 'Happy Customers', value: '20k+' },
                { label: 'Fresh Products', value: '500+' },
                { label: 'Fast Delivery', value: '24h' }
            ];
        }
        setFormData(data);
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load home settings");
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const handleStatChange = (index, field, value) => {
    const newStats = [...formData.hero.stats];
    newStats[index][field] = value;
    setFormData(prev => ({
      ...prev,
      hero: { ...prev.hero, stats: newStats }
    }));
  };

  const handleSave = async () => {
    try {
      await api.put('/home-config', formData);
      toast.success("Homepage updated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update homepage");
    }
  };

  if (loading) return <div className="home-editor-container">Loading settings...</div>;

  return (
    <div className="home-editor-container">
      <div className="editor-header">
        <h1 className="editor-title">Homepage Management</h1>
        <button onClick={handleSave} className="save-btn">
          <Save size={18} />
          Save Changes
        </button>
      </div>
      
      <div className="editor-content">
        {/* Hero Section */}
        <div className="editor-section">
          <h2 className="section-title">
            <Layout size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Hero Section
          </h2>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input 
              className="form-input"
              value={formData.hero.title}
              onChange={(e) => handleChange('hero', 'title', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Subtitle</label>
            <textarea 
              className="form-textarea"
              rows="2"
              value={formData.hero.subtitle}
              onChange={(e) => handleChange('hero', 'subtitle', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Background Image URL</label>
            <div className="input-with-icon">
              <input 
                className="form-input"
                value={formData.hero.backgroundImage}
                onChange={(e) => handleChange('hero', 'backgroundImage', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <p className="image-preview-help">Recommended: 1920x1080px high quality image</p>
          </div>
          
          <div className="form-group">
            <label className="form-label">Key Statistics</label>
            <div className="stats-grid">
              {formData.hero.stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <input 
                    className="form-input stat-input-val"
                    placeholder="Value (e.g. 20k+)"
                    value={stat.value}
                    onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                  />
                  <input 
                    className="form-input stat-input-label"
                    placeholder="Label"
                    value={stat.label}
                    onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bundle Section */}
        <div className="editor-section">
          <h2 className="section-title">
            <Type size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Bundle Section
          </h2>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input 
              className="form-input"
              value={formData.bundle.title}
              onChange={(e) => handleChange('bundle', 'title', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-textarea"
              rows="3"
              value={formData.bundle.description}
              onChange={(e) => handleChange('bundle', 'description', e.target.value)}
            />
          </div>
          <div className="grid-2-col">
              <div className="form-group">
                  <label className="form-label">Price</label>
                  <input 
                      type="number"
                      className="form-input"
                      value={formData.bundle.price}
                      onChange={(e) => handleChange('bundle', 'price', e.target.value)}
                  />
              </div>
              <div className="form-group">
                  <label className="form-label">Image URL (Optional)</label>
                  <input 
                      className="form-input"
                      value={formData.bundle.image}
                      onChange={(e) => handleChange('bundle', 'image', e.target.value)}
                      placeholder="Leave empty for default"
                  />
              </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="editor-section">
          <h2 className="section-title">
            <ImageIcon size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
            Story Section
          </h2>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input 
              className="form-input"
              value={formData.story.title}
              onChange={(e) => handleChange('story', 'title', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Subtitle</label>
            <input 
              className="form-input"
              value={formData.story.subtitle}
              onChange={(e) => handleChange('story', 'subtitle', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-textarea"
              rows="4"
              value={formData.story.description}
              onChange={(e) => handleChange('story', 'description', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Image URL</label>
            <input 
              className="form-input"
              value={formData.story.image}
              onChange={(e) => handleChange('story', 'image', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeEditor;
