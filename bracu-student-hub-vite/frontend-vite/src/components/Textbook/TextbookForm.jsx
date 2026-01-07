import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import authService from '../../services/auth';
import { useNavigate } from 'react-router-dom';

const TextbookForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    price: '',
    courseCode: '',
    condition: 'Good',
    transactionType: 'Sell',
    description: '',
    isbn: '',
    edition: '',
    contactMethod: 'Email', // Added contact method
    contactInfo: '', // Added contact info
    location: '', // Added meeting location
    tags: [], // Added tags
    images: []
  });
  
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  // Check if user is authenticated
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      alert('Please login to list a textbook');
      navigate('/login');
      return;
    }
    
    // Check if user is admin and redirect
    if (user?.role === 'admin' || user?.isAdmin) {
      alert('Admins cannot upload textbooks. Please use a regular user account.');
      navigate('/textbooks');
      return;
    }
    
    // Pre-fill contact info from user profile
    if (user) {
      setFormData(prev => ({
        ...prev,
        contactInfo: user.email || '',
        location: 'BRAC University Campus' // Default location
      }));
    }
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTagAdd = () => {
    if (!tagInput.trim()) return;
    if (formData.tags.length >= 5) {
      alert('Maximum 5 tags allowed');
      return;
    }
    
    const newTag = tagInput.trim().toLowerCase();
    if (!formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
    }
    setTagInput('');
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (files.length + formData.images.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    
    setUploading(true);
    
    try {
      // Create previews first
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      
      // Store the files directly (will be uploaded when form is submitted)
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...files]
      }));
      
    } catch (error) {
      console.error('Error handling images:', error);
      alert('Failed to process images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    // Revoke object URL to prevent memory leak
    if (imagePreviews[index]) {
      URL.revokeObjectURL(imagePreviews[index]);
    }
    
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return false;
    }
    if (!formData.author.trim()) {
      alert('Please enter the author');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Please enter a valid price');
      return false;
    }
    if (!formData.contactInfo.trim()) {
      alert('Please enter your contact information');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Check if user is admin (double check)
    if (user?.role === 'admin' || user?.isAdmin) {
      alert('Admins cannot upload textbooks');
      return;
    }
    
    setUploading(true);
    
    try {
      const formDataToSend = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'images') {
          // For image files
          if (Array.isArray(formData.images)) {
            formData.images.forEach((image, index) => {
              if (image instanceof File) {
                formDataToSend.append('images', image);
              }
            });
          }
        } else if (key === 'tags') {
          // Convert tags array to string
          if (Array.isArray(formData.tags)) {
            formDataToSend.append(key, JSON.stringify(formData.tags));
          }
        } else {
          // All other fields
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add user info
      if (user) {
        formDataToSend.append('sellerId', user.id);
        formDataToSend.append('sellerName', user.name || user.email);
        formDataToSend.append('sellerEmail', user.email);
      }
      
      console.log('Submitting textbook data...');
      
      const response = await axios.post('/api/textbooks', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        alert('Textbook listed successfully!');
        
        // If onSubmit prop exists (for inline forms), call it
        if (onSubmit) {
          onSubmit(formData);
        } else {
          // Otherwise navigate to textbooks page
          navigate('/textbooks');
        }
      } else {
        alert('Failed to list textbook: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating textbook:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to list textbook. Please try again.';
      
      // Show more specific error messages
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorList = Object.values(errors).map(err => err.message).join('\n');
        alert('Validation errors:\n' + errorList);
      } else {
        alert('Error: ' + errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    // Revoke all object URLs to prevent memory leaks
    imagePreviews.forEach(url => URL.revokeObjectURL(url));
    
    if (onCancel) {
      onCancel();
    } else {
      navigate('/textbooks');
    }
  };

  // If user is admin, show message instead of form
  if (user?.role === 'admin' || user?.isAdmin) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '60px', color: '#ef4444', marginBottom: '20px' }}>🚫</div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '15px' }}>
            Admin Access Restriction
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '25px' }}>
            As an administrator, you cannot upload textbooks. This feature is available only to regular users to maintain marketplace integrity.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
              onClick={() => navigate('/admin/textbooks')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '8px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              📚 Go to Textbook Admin Panel
            </button>
            <button
              onClick={() => navigate('/textbooks')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                borderRadius: '8px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Browse Textbooks
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '10px' }}>📝 List a Textbook</h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Fill out the form below to list your textbook</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ 
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          padding: '30px'
        }}>
          {/* Basic Information */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Title *</label>
            <input
              type="text"
              name="title"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="Enter textbook title"
              disabled={uploading}
            />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Author *</label>
            <input
              type="text"
              name="author"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              value={formData.author}
              onChange={handleInputChange}
              required
              placeholder="Enter author name"
              disabled={uploading}
            />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Price (৳) *</label>
            <input
              type="number"
              name="price"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              disabled={uploading}
            />
          </div>
          
          {/* Course Information */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Course Code</label>
            <input
              type="text"
              name="courseCode"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              value={formData.courseCode}
              onChange={handleInputChange}
              placeholder="e.g., CSE220"
              disabled={uploading}
            />
          </div>
          
          {/* Additional Information */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>ISBN</label>
            <input
              type="text"
              name="isbn"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              value={formData.isbn}
              onChange={handleInputChange}
              placeholder="Enter ISBN number"
              disabled={uploading}
            />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Edition</label>
            <input
              type="text"
              name="edition"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              value={formData.edition}
              onChange={handleInputChange}
              placeholder="e.g., 4th Edition"
              disabled={uploading}
            />
          </div>
          
          {/* Condition */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Condition</label>
            <select
              name="condition"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                outline: 'none'
              }}
              value={formData.condition}
              onChange={handleInputChange}
              disabled={uploading}
            >
              <option value="New">New</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
          
          {/* Transaction Type */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Transaction Type</label>
            <select
              name="transactionType"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                outline: 'none'
              }}
              value={formData.transactionType}
              onChange={handleInputChange}
              disabled={uploading}
            >
              <option value="Sell">Sell</option>
              <option value="Exchange">Exchange</option>
              <option value="Both">Sell or Exchange</option>
            </select>
          </div>
          
          {/* Contact Information */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Preferred Contact Method *</label>
            <select
              name="contactMethod"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'white',
                outline: 'none'
              }}
              value={formData.contactMethod}
              onChange={handleInputChange}
              disabled={uploading}
            >
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Messenger">Messenger</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Contact Information *
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                {formData.contactMethod === 'Email' ? '(e.g., yourname@email.com)' :
                 formData.contactMethod === 'Phone' ? '(e.g., +8801XXXXXXXXX)' :
                 formData.contactMethod === 'WhatsApp' ? '(e.g., +8801XXXXXXXXX)' :
                 '(e.g., your.facebook.profile)'}
              </span>
            </label>
            <input
              type="text"
              name="contactInfo"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              value={formData.contactInfo}
              onChange={handleInputChange}
              required
              placeholder={
                formData.contactMethod === 'Email' ? 'Enter your email address' :
                formData.contactMethod === 'Phone' ? 'Enter your phone number' :
                formData.contactMethod === 'WhatsApp' ? 'Enter your WhatsApp number' :
                'Enter your Messenger profile'
              }
              disabled={uploading}
            />
          </div>
          
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Meeting Location</label>
            <input
              type="text"
              name="location"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none'
              }}
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., BRAC University Campus, Dhaka"
              disabled={uploading}
            />
          </div>
          
          {/* Tags */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
              Tags
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal', marginLeft: '8px' }}>
                (e.g., programming, mathematics, physics)
              </span>
            </label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="Add a tag and press Enter"
                disabled={uploading || formData.tags.length >= 5}
              />
              <button
                type="button"
                onClick={handleTagAdd}
                style={{
                  padding: '12px 20px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                disabled={uploading || !tagInput.trim() || formData.tags.length >= 5}
              >
                Add
              </button>
            </div>
            
            {formData.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '20px',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b7280',
                        cursor: 'pointer',
                        fontSize: '12px',
                        padding: '2px'
                      }}
                      disabled={uploading}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
              {formData.tags.length}/5 tags added
            </p>
          </div>
          
          {/* Description */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Description</label>
            <textarea
              name="description"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                minHeight: '120px',
                resize: 'vertical'
              }}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your textbook (condition, markings, highlights, notes, etc.)"
              rows="4"
              disabled={uploading}
            />
          </div>
          
          {/* Image Upload */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '15px' }}>
              <span style={{ marginRight: '8px' }}>📸</span>
              Upload Images (Max 5)
            </label>
            <div>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={uploading || formData.images.length >= 5}
              />
              <label 
                htmlFor="image-upload" 
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  backgroundColor: uploading || formData.images.length >= 5 ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: uploading || formData.images.length >= 5 ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: uploading || formData.images.length >= 5 ? 0.7 : 1
                }}
              >
                {uploading ? 'Uploading...' : formData.images.length >= 5 ? 'Max 5 images reached' : 'Choose Images'}
              </label>
              <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                Upload up to 5 images (JPEG, PNG, WebP)
              </p>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginTop: '20px' }}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} style={{ position: 'relative', width: '120px', height: '120px' }}>
                      <img 
                        src={preview} 
                        alt={`Preview ${index + 1}`} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover', 
                          borderRadius: '8px',
                          border: '1px solid #d1d5db'
                        }} 
                      />
                      <button 
                        type="button" 
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          width: '28px',
                          height: '28px',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onClick={() => removeImage(index)}
                        disabled={uploading}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px' }}>
            <button 
              type="submit" 
              style={{
                padding: '14px 28px',
                backgroundColor: uploading ? '#9ca3af' : '#10b981',
                color: 'white',
                borderRadius: '8px',
                fontWeight: 'bold',
                border: 'none',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                flex: 1,
                opacity: uploading ? 0.7 : 1
              }}
              disabled={uploading}
            >
              {uploading ? 'Listing Textbook...' : 'List Textbook'}
            </button>
            <button 
              type="button" 
              style={{
                padding: '14px 28px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                borderRadius: '8px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                flex: 1
              }} 
              onClick={handleCancel}
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TextbookForm;