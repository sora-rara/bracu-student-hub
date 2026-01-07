import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import authService from '../../services/auth';

const TextbookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [textbook, setTextbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    fetchTextbook();
  }, [id]);

  const fetchTextbook = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/textbooks/${id}`);
      if (response.data.success) {
        setTextbook(response.data.data);
        const user = authService.getCurrentUser();
        if (user) {
          setIsFavorited(response.data.data.favorites?.includes(user.id));
        }
      } else {
        setError(response.data.error);
      }
    } catch (error) {
      console.error('Error fetching textbook:', error);
      setError('Failed to load textbook details');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!authService.isAuthenticated()) {
      alert('Please login to add to favorites');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(`/api/textbooks/${id}/toggle-favorite`);
      if (response.data.success) {
        setIsFavorited(!isFavorited);
        setTextbook(prev => ({
          ...prev,
          favorites: response.data.data.isFavorited
            ? [...prev.favorites, authService.getCurrentUser().id]
            : prev.favorites.filter(id => id !== authService.getCurrentUser().id)
        }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!window.confirm(`Mark this listing as ${newStatus}?`)) return;

    try {
      const response = await axios.patch(`/api/textbooks/${id}/status`, { status: newStatus });
      if (response.data.success) {
        setTextbook(prev => ({ ...prev, status: newStatus }));
        alert(`Listing marked as ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await axios.delete(`/api/textbooks/${id}`);
      alert('Listing deleted successfully');
      navigate('/textbooks');
    } catch (error) {
      console.error('Error deleting textbook:', error);
      alert('Failed to delete listing');
    }
  };

  const getImageUrl = (image) => {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (!image) return 'https://via.placeholder.com/600x400?text=No+Image';
    if (image.startsWith('http')) return image;
    return `${BASE_URL}/uploads/textbooks/${image}`;
  };

  const getConditionColor = (condition) => {
    const colors = {
      'New': { backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#a7f3d0' },
      'Like New': { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' },
      'Good': { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' },
      'Fair': { backgroundColor: '#fde68a', color: '#78350f', borderColor: '#fbbf24' },
      'Poor': { backgroundColor: '#fecaca', color: '#991b1b', borderColor: '#f87171' }
    };
    return colors[condition] || { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '100px',
              height: '100px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '30px'
            }}></div>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ fontSize: '36px' }}>📚</span>
            </div>
          </div>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '15px' }}>Loading Textbook Details</h3>
          <p style={{ color: '#6b7280' }}>Please wait while we fetch the information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fef2f2 0%, #fed7d7 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          width: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #ffebee 100%)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(239, 68, 68, 0.1)',
          padding: '40px',
          border: '2px solid #fecaca'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 10px 20px rgba(239, 68, 68, 0.1)'
            }}>
              <span style={{ fontSize: '36px', color: '#dc2626' }}>⚠️</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#991b1b', marginBottom: '10px' }}>Error Loading Textbook</h3>
            <p style={{ color: '#dc2626', fontSize: '18px' }}>{error}</p>
          </div>
          <Link 
            to="/textbooks" 
            style={{
              display: 'block',
              width: '100%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '15px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '18px',
              textDecoration: 'none',
              textAlign: 'center',
              boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)'
            }}
          >
            ← Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  if (!textbook) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        padding: '20px'
      }}>
        <div style={{ 
          maxWidth: '500px', 
          width: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(245, 158, 11, 0.1)',
          padding: '40px',
          border: '2px solid #fde68a'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#fef3c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 10px 20px rgba(245, 158, 11, 0.1)'
            }}>
              <span style={{ fontSize: '36px', color: '#d97706' }}>🔍</span>
            </div>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#92400e', marginBottom: '10px' }}>Textbook Not Found</h3>
            <p style={{ color: '#d97706', fontSize: '18px' }}>The textbook you're looking for doesn't exist or has been removed.</p>
          </div>
          <Link 
            to="/textbooks" 
            style={{
              display: 'block',
              width: '100%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              padding: '15px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '18px',
              textDecoration: 'none',
              textAlign: 'center',
              boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)'
            }}
          >
            ← Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  const user = authService.getCurrentUser();
  const isOwner = user && user.id === textbook.sellerId;
  const canContact = textbook.status === 'Available' && !isOwner;
  const conditionStyle = getConditionColor(textbook.condition);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Breadcrumb */}
        <nav style={{ marginBottom: '30px' }}>
          <ol style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '12px',
            fontSize: '16px',
            color: '#6b7280',
            fontWeight: '500',
            flexWrap: 'wrap'
          }}>
            <li>
              <Link 
                to="/" 
                style={{ 
                  color: '#6b7280',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>🏠</span>
                <span>Home</span>
              </Link>
            </li>
            <li style={{ color: '#d1d5db' }}>›</li>
            <li>
              <Link 
                to="/textbooks" 
                style={{ 
                  color: '#6b7280',
                  textDecoration: 'none'
                }}
              >
                Textbooks
              </Link>
            </li>
            <li style={{ color: '#d1d5db' }}>›</li>
            <li style={{ color: '#1f2937', fontWeight: 'bold', fontSize: '18px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {textbook.title}
            </li>
          </ol>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', '@media (min-width: 1024px)': { gridTemplateColumns: '2fr 1fr' } }}>
          {/* Left Column - Images */}
          <div>
            {/* Main Image */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              border: '2px solid #e5e7eb',
              marginBottom: '30px'
            }}>
              <div style={{ position: 'relative', height: '500px', background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
                <img
                  src={getImageUrl(textbook.images?.[activeImage])}
                  alt={textbook.title}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '40px' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
                  }}
                />
                {!textbook.images?.[activeImage] && (
                  <div style={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '72px', marginBottom: '20px', opacity: 0.4 }}>📚</div>
                      <p style={{ color: '#9ca3af', fontSize: '20px', fontWeight: '500' }}>No Image Available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {textbook.images && textbook.images.length > 1 && (
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                padding: '25px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                  {textbook.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      style={{
                        flexShrink: 0,
                        width: '100px',
                        height: '100px',
                        borderRadius: '12px',
                        border: activeImage === index ? '3px solid #3b82f6' : '2px solid #d1d5db',
                        overflow: 'hidden',
                        background: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`Thumbnail ${index + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description Card */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              padding: '40px',
              border: '2px solid #e5e7eb',
              marginTop: '30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '30px', paddingBottom: '30px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ padding: '15px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '15px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.1)' }}>
                  <span style={{ fontSize: '32px', color: '#3b82f6' }}>📝</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>Description</h3>
                  <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '18px' }}>Detailed information about the textbook</p>
                </div>
              </div>
              {textbook.description ? (
                <p style={{ color: '#4b5563', lineHeight: '1.8', fontSize: '18px', whiteSpace: 'pre-line' }}>{textbook.description}</p>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <p style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '18px' }}>No description provided.</p>
                </div>
              )}
              
              {/* Tags */}
              {textbook.tags && textbook.tags.length > 0 && (
                <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                    <div style={{ padding: '12px', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                      <span style={{ fontSize: '24px', color: '#6b7280' }}>🏷️</span>
                    </div>
                    <h4 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1f2937' }}>Tags</h4>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {textbook.tags.map((tag, index) => (
                      <span
                        key={index}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                          color: '#4b5563',
                          borderRadius: '12px',
                          border: '2px solid #d1d5db',
                          fontSize: '16px',
                          fontWeight: '600'
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Details */}
          <div>
            {/* Status & Actions Card */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              padding: '30px',
              border: '2px solid #e5e7eb',
              marginBottom: '30px'
            }}>
              {/* Status & Favorite */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', paddingBottom: '25px', borderBottom: '1px solid #e5e7eb' }}>
                <span style={{
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  background: textbook.status === 'Available' 
                    ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' 
                    : textbook.status === 'Pending'
                    ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
                    : 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                  color: textbook.status === 'Available' ? '#065f46' : textbook.status === 'Pending' ? '#92400e' : '#4b5563',
                  border: '2px solid',
                  borderColor: textbook.status === 'Available' ? '#a7f3d0' : textbook.status === 'Pending' ? '#fde68a' : '#d1d5db'
                }}>
                  {textbook.status}
                </span>
                
                <button
                  onClick={handleFavoriteToggle}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: '2px solid',
                    borderColor: isFavorited ? '#fca5a5' : '#d1d5db',
                    background: isFavorited 
                      ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' 
                      : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                    color: isFavorited ? '#dc2626' : '#6b7280',
                    cursor: 'pointer'
                  }}
                  title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <svg style={{ width: '28px', height: '28px' }} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                  </svg>
                </button>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '30px' }}>
                <div style={{ 
                  fontSize: '48px', 
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  ৳{textbook.price.toFixed(2)}
                </div>
                <p style={{ fontSize: '18px', color: '#6b7280', marginTop: '10px' }}>Negotiable</p>
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '20px' }}>
                    Last Updated: {formatDate(textbook.updatedAt || textbook.createdAt)}
                  </span>
                </div>
              </div>

              {/* Contact Section */}
              {canContact && (
                <div style={{ marginBottom: '30px' }}>
                  {!showContact ? (
                    <button
                      onClick={() => setShowContact(true)}
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        padding: '18px',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)'
                      }}
                    >
                      Show Contact Information
                    </button>
                  ) : (
                    <div style={{ 
                      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      border: '2px solid #bfdbfe',
                      borderRadius: '15px',
                      padding: '25px',
                      boxShadow: '0 10px 20px rgba(59, 130, 246, 0.1)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                        <div style={{ padding: '15px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '12px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.1)' }}>
                          <span style={{ fontSize: '28px', color: '#3b82f6' }}>📞</span>
                        </div>
                        <div>
                          <h4 style={{ fontWeight: 'bold', color: '#1e40af', fontSize: '20px' }}>Contact Seller</h4>
                          <p style={{ color: '#3b82f6', fontSize: '16px' }}>Reach out to discuss purchase</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '18px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px' }}>
                          <div style={{ padding: '12px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '10px' }}>
                            <svg style={{ width: '24px', height: '24px', color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>Seller Name</p>
                            <p style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>{textbook.sellerName}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '18px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px' }}>
                          <div style={{ padding: '12px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '10px' }}>
                            <svg style={{ width: '24px', height: '24px', color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>Email Address</p>
                            <p style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>{textbook.sellerEmail}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '18px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px' }}>
                          <div style={{ padding: '12px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '10px' }}>
                            <svg style={{ width: '24px', height: '24px', color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>Preferred Contact</p>
                            <p style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>
                              <span style={{ color: '#3b82f6' }}>{textbook.contactMethod}:</span> {textbook.contactInfo}
                            </p>
                          </div>
                        </div>
                        {textbook.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '18px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px' }}>
                            <div style={{ padding: '12px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '10px' }}>
                              <svg style={{ width: '24px', height: '24px', color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontSize: '14px', color: '#6b7280' }}>Meeting Location</p>
                              <p style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '18px' }}>{textbook.location}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Owner Actions */}
              {isOwner && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ padding: '15px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '12px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.1)' }}>
                      <span style={{ fontSize: '28px', color: '#3b82f6' }}>⚙️</span>
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '20px' }}>Manage Listing</h4>
                      <p style={{ color: '#6b7280', fontSize: '16px' }}>Update or delete your listing</p>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Link
                      to={`/textbooks/edit/${textbook._id}`}
                      style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        textDecoration: 'none'
                      }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={handleDelete}
                      style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  
                  {textbook.status === 'Available' && (
                    <div style={{ paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '20px', fontWeight: '600' }}>Update Status:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        <button
                          onClick={() => handleStatusUpdate('Pending')}
                          style={{
                            padding: '12px',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            color: '#92400e',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            border: '2px solid #fde68a',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Pending
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('Sold')}
                          style={{
                            padding: '12px',
                            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                            color: '#065f46',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            border: '2px solid #a7f3d0',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Sold
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('Exchanged')}
                          style={{
                            padding: '12px',
                            background: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)',
                            color: '#7e22ce',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            border: '2px solid #d8b4fe',
                            cursor: 'pointer'
                          }}
                        >
                          Mark Exchanged
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Details Card */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              padding: '30px',
              border: '2px solid #e5e7eb',
              marginBottom: '30px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px', paddingBottom: '25px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ padding: '15px', background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
                  <span style={{ fontSize: '28px', color: '#6b7280' }}>📋</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>Details</h3>
                  <p style={{ color: '#6b7280', fontSize: '16px' }}>Textbook specifications</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {[
                  { label: 'Title', value: textbook.title, icon: '📖' },
                  { label: 'Author', value: textbook.author, icon: '✍️' },
                  ...(textbook.courseCode ? [{ label: 'Course', value: `${textbook.courseCode} - ${textbook.courseName}`, icon: '🎓' }] : []),
                  ...(textbook.isbn ? [{ label: 'ISBN', value: textbook.isbn, icon: '🔢' }] : []),
                  { label: 'Edition', value: textbook.edition, icon: '📓' },
                  { label: 'Condition', value: textbook.condition, icon: '⭐', isBadge: true },
                  { label: 'Transaction Type', value: textbook.transactionType, icon: '💱' },
                  { label: 'Listed On', value: formatDate(textbook.createdAt), icon: '📅' },
                  { label: 'Views', value: textbook.viewCount || 0, icon: '👁️' },
                  { label: 'Favorites', value: textbook.favorites?.length || 0, icon: '❤️' }
                ].map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '15px',
                    backgroundColor: 'rgba(249, 250, 251, 0.5)',
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '20px' }}>{item.icon}</span>
                      <span style={{ fontSize: '16px', color: '#6b7280', fontWeight: '600' }}>{item.label}</span>
                    </div>
                    {item.isBadge ? (
                      <span style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        ...conditionStyle
                      }}>
                        {item.value}
                      </span>
                    ) : (
                      <span style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '16px' }}>{item.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Seller Info Card */}
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              padding: '30px',
              border: '2px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px', paddingBottom: '25px', borderBottom: '1px solid #e5e7eb' }}>
                <div style={{ padding: '15px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '12px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.1)' }}>
                  <span style={{ fontSize: '28px', color: '#3b82f6' }}>👤</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>Seller Information</h3>
                  <p style={{ color: '#6b7280', fontSize: '16px' }}>Listing owner details</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px' }}>
                {textbook.sellerId?.profilePicture ? (
                  <img
                    src={textbook.sellerId.profilePicture}
                    alt={textbook.sellerName}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '4px solid white', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                  />
                ) : (
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '4px solid white',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                  }}>
                    <span style={{ color: '#1e40af', fontWeight: 'bold', fontSize: '28px' }}>
                      {textbook.sellerName?.charAt(0) || 'U'}
                    </span>
                  </div>
                )}
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '20px' }}>{textbook.sellerName}</h4>
                  <p style={{ fontSize: '16px', color: '#6b7280' }}>{textbook.sellerEmail}</p>
                  <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '8px' }}>
                    Seller since {new Date(textbook.sellerId?.createdAt || textbook.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Link
                to={`/textbooks?seller=${textbook.sellerId?._id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#3b82f6',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textDecoration: 'none'
                }}
              >
                View all listings from this seller
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Related Textbooks Section */}
        {textbook.courseCode && (
          <div style={{ marginTop: '50px', paddingTop: '40px', borderTop: '1px solid #e5e7eb' }}>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '20px',
              marginBottom: '30px',
              '@media (min-width: 640px)': {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ padding: '15px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '12px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.1)' }}>
                  <span style={{ fontSize: '28px', color: '#3b82f6' }}>📚</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
                    Other {textbook.courseCode} Textbooks
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '16px' }}>Browse similar listings for this course</p>
                </div>
              </div>
              <Link 
                to={`/textbooks?course=${textbook.courseCode}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: '#3b82f6',
                  fontWeight: 'bold',
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  border: '2px solid #bfdbfe'
                }}
              >
                View All
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '20px',
              '@media (min-width: 640px)': {
                gridTemplateColumns: 'repeat(2, 1fr)'
              },
              '@media (min-width: 1024px)': {
                gridTemplateColumns: 'repeat(4, 1fr)'
              }
            }}>
              {/* Related textbooks would go here */}
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '40px',
                background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                borderRadius: '20px',
                border: '2px dashed #d1d5db'
              }}>
                <div style={{ display: 'inline-block', padding: '20px', backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
                  <span style={{ fontSize: '36px', color: '#9ca3af' }}>📚</span>
                </div>
                <h4 style={{ fontSize: '20px', fontWeight: 'bold', color: '#6b7280', marginBottom: '10px' }}>Related Textbooks</h4>
                <p style={{ color: '#9ca3af', maxWidth: '400px', margin: '0 auto' }}>
                  Loading related textbooks for {textbook.courseCode}...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TextbookDetail;