import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import authService from '../../services/auth';
import TextbookCard from '../Textbook/TextbookCard';

const MyListingsPage = () => {
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    sold: 0,
    exchanged: 0,
    total: 0
  });

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/textbooks/user/my-listings');
      if (response.data.success) {
        setTextbooks(response.data.data);
        calculateStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (listings) => {
    const stats = {
      active: 0,
      pending: 0,
      sold: 0,
      exchanged: 0,
      total: listings.length
    };

    listings.forEach(listing => {
      if (stats[listing.status.toLowerCase()] !== undefined) {
        stats[listing.status.toLowerCase()]++;
      }
    });

    setStats(stats);
  };

  const handleDelete = (textbookId) => {
    setTextbooks(prev => prev.filter(textbook => textbook._id !== textbookId));
    fetchMyListings();
  };

  const handleStatusUpdate = async (textbookId, newStatus) => {
    try {
      await axios.patch(`/api/textbooks/${textbookId}/status`, { status: newStatus });
      fetchMyListings();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getTextbooksByStatus = (status) => {
    return textbooks.filter(textbook => textbook.status === status);
  };

  if (!authService.isAuthenticated()) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%)',
        padding: '16px'
      }}>
        <div style={{
          maxWidth: '448px',
          width: '100%',
          background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
          borderRadius: '24px',
          boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
          padding: '40px',
          border: '2px solid #fcd34d'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#fef3c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 10px 15px rgba(0,0,0,0.1)'
            }}>
              <span style={{ fontSize: '36px', color: '#d97706' }}>🔒</span>
            </div>
            <h3 style={{ fontSize: '30px', fontWeight: 'bold', color: '#92400e', marginBottom: '12px' }}>Login Required</h3>
            <p style={{ color: '#b45309', fontSize: '18px' }}>Please login to view your listings.</p>
          </div>
          <Link to="/login" style={{
            display: 'block',
            width: '100%',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: 'white',
            padding: '16px',
            borderRadius: '24px',
            fontWeight: 'bold',
            fontSize: '20px',
            textDecoration: 'none',
            textAlign: 'center'
          }}>
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #dbeafe 0%, #d1fae5 100%)'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '48px 16px' }}>
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px' }}>
            <div style={{ padding: '20px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '24px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>
              <span style={{ fontSize: '36px', color: '#2563eb' }}>📋</span>
            </div>
            <div>
              <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>My Textbook Listings</h1>
              <p style={{ color: '#4b5563', fontSize: '20px' }}>Manage your textbook listings and track their status</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '24px',
          marginBottom: '48px',
          '@media (min-width: 1024px)': { gridTemplateColumns: 'repeat(5, 1fr)' }
        }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            borderRadius: '24px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
            padding: '24px',
            border: '2px solid #bbf7d0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: '#dcfce7', borderRadius: '16px' }}>
                <span style={{ fontSize: '24px', color: '#16a34a' }}>✅</span>
              </div>
              <div>
                <div style={{ fontSize: '18px', color: '#374151', fontWeight: '600' }}>Active</div>
                <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#16a34a' }}>{stats.active}</div>
              </div>
            </div>
          </div>
          <div style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
            borderRadius: '24px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
            padding: '24px',
            border: '2px solid #fde68a'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '16px' }}>
                <span style={{ fontSize: '24px', color: '#d97706' }}>⏳</span>
              </div>
              <div>
                <div style={{ fontSize: '18px', color: '#374151', fontWeight: '600' }}>Pending</div>
                <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#d97706' }}>{stats.pending}</div>
              </div>
            </div>
          </div>
          <div style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
            borderRadius: '24px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
            padding: '24px',
            border: '2px solid #bfdbfe'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: '#dbeafe', borderRadius: '16px' }}>
                <span style={{ fontSize: '24px', color: '#2563eb' }}>💰</span>
              </div>
              <div>
                <div style={{ fontSize: '18px', color: '#374151', fontWeight: '600' }}>Sold</div>
                <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#2563eb' }}>{stats.sold}</div>
              </div>
            </div>
          </div>
          <div style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)',
            borderRadius: '24px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
            padding: '24px',
            border: '2px solid #ddd6fe'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: '#f3e8ff', borderRadius: '16px' }}>
                <span style={{ fontSize: '24px', color: '#7c3aed' }}>🔄</span>
              </div>
              <div>
                <div style={{ fontSize: '18px', color: '#374151', fontWeight: '600' }}>Exchanged</div>
                <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#7c3aed' }}>{stats.exchanged}</div>
              </div>
            </div>
          </div>
          <div style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
            borderRadius: '24px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
            padding: '24px',
            border: '2px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '16px' }}>
                <span style={{ fontSize: '24px', color: '#4b5563' }}>📊</span>
              </div>
              <div>
                <div style={{ fontSize: '18px', color: '#374151', fontWeight: '600' }}>Total</div>
                <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>{stats.total}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '48px' }}>
          <Link
            to="/textbooks/create"
            style={{
              padding: '20px 40px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: 'white',
              borderRadius: '24px',
              fontWeight: 'bold',
              fontSize: '20px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <span>📝</span>
            + List New Textbook
          </Link>
          <Link
            to="/textbooks"
            style={{
              padding: '20px 40px',
              background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
              color: '#1f2937',
              borderRadius: '24px',
              fontWeight: 'bold',
              fontSize: '20px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <span>🔍</span>
            Browse Textbook
          </Link>
          <button
            onClick={fetchMyListings}
            style={{
              padding: '20px 40px',
              background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
              color: '#166534',
              borderRadius: '24px',
              fontWeight: 'bold',
              fontSize: '20px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <span>🔄</span>
            Refresh List
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '64px',
            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
            borderRadius: '24px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
            border: '2px solid #bfdbfe'
          }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <div style={{
                width: '80px',
                height: '80px',
                border: '4px solid #bfdbfe',
                borderTop: '4px solid #2563eb',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '24px'
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
                <span style={{ fontSize: '24px', color: '#2563eb' }}>📚</span>
              </div>
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>Loading Your Listings</h3>
            <p style={{ color: '#4b5563', fontSize: '18px' }}>Please wait while we fetch your textbook listings...</p>
          </div>
        ) : textbooks.length === 0 ? (
          <div style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
            borderRadius: '24px',
            boxShadow: '0 20px 25px rgba(0,0,0,0.1)',
            padding: '64px',
            textAlign: 'center',
            border: '2px solid #bfdbfe'
          }}>
            <div style={{ display: 'inline-block', padding: '32px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '50%', boxShadow: '0 20px 25px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
              <span style={{ fontSize: '48px' }}>📚</span>
            </div>
            <h3 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>No Listings Yet</h3>
            <p style={{ color: '#4b5563', fontSize: '20px', marginBottom: '40px', maxWidth: '512px', margin: '0 auto' }}>
              Start by listing your first textbook for sale or exchange
            </p>
            <Link
              to="/textbooks/create"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '16px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '16px 48px',
                borderRadius: '24px',
                fontWeight: 'bold',
                fontSize: '20px',
                textDecoration: 'none'
              }}
            >
              <span>📝</span>
              List Your First Textbook
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {/* Active Listings */}
            {getTextbooksByStatus('Available').length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ padding: '12px', background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', borderRadius: '16px' }}>
                    <span style={{ fontSize: '24px', color: '#16a34a' }}>✅</span>
                  </div>
                  <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>Active Listings ({getTextbooksByStatus('Available').length})</h2>
                </div>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '32px',
                  '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
                  '@media (min-width: 1024px)': { gridTemplateColumns: 'repeat(3, 1fr)' }
                }}>
                  {getTextbooksByStatus('Available').map(textbook => (
                    <TextbookCard
                      key={textbook._id}
                      textbook={textbook}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Pending Listings */}
            {getTextbooksByStatus('Pending').length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ padding: '12px', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', borderRadius: '16px' }}>
                    <span style={{ fontSize: '24px', color: '#d97706' }}>⏳</span>
                  </div>
                  <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>Pending ({getTextbooksByStatus('Pending').length})</h2>
                </div>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '32px',
                  '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
                  '@media (min-width: 1024px)': { gridTemplateColumns: 'repeat(3, 1fr)' }
                }}>
                  {getTextbooksByStatus('Pending').map(textbook => (
                    <TextbookCard
                      key={textbook._id}
                      textbook={textbook}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sold Listings */}
            {getTextbooksByStatus('Sold').length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ padding: '12px', background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', borderRadius: '16px' }}>
                    <span style={{ fontSize: '24px', color: '#2563eb' }}>💰</span>
                  </div>
                  <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>Sold ({getTextbooksByStatus('Sold').length})</h2>
                </div>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '32px',
                  '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
                  '@media (min-width: 1024px)': { gridTemplateColumns: 'repeat(3, 1fr)' }
                }}>
                  {getTextbooksByStatus('Sold').map(textbook => (
                    <TextbookCard
                      key={textbook._id}
                      textbook={textbook}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Exchanged Listings */}
            {getTextbooksByStatus('Exchanged').length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ padding: '12px', background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', borderRadius: '16px' }}>
                    <span style={{ fontSize: '24px', color: '#7c3aed' }}>🔄</span>
                  </div>
                  <h2 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>Exchanged ({getTextbooksByStatus('Exchanged').length})</h2>
                </div>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '32px',
                  '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
                  '@media (min-width: 1024px)': { gridTemplateColumns: 'repeat(3, 1fr)' }
                }}>
                  {getTextbooksByStatus('Exchanged').map(textbook => (
                    <TextbookCard
                      key={textbook._id}
                      textbook={textbook}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div style={{ marginTop: '48px', paddingTop: '40px', borderTop: '1px solid #d1d5db' }}>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                '@media (min-width: 640px)': {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>
                  📊 Total Listings: <span style={{ color: '#2563eb' }}>{stats.total}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <Link
                    to="/textbooks/create"
                    style={{
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                      color: '#1d4ed8',
                      borderRadius: '16px',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                      border: '2px solid #bfdbfe'
                    }}
                  >
                    Add More Listings
                  </Link>
                  <button
                    onClick={fetchMyListings}
                    style={{
                      padding: '16px 32px',
                      background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                      color: '#374151',
                      borderRadius: '16px',
                      fontWeight: 'bold',
                      border: '2px solid #d1d5db',
                      cursor: 'pointer'
                    }}
                  >
                    Refresh All
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyListingsPage;