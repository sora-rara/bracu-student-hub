import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import authService from '../../services/auth';
import TextbookCard from '../Textbook/TextbookCard';

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      fetchFavorites();
    }
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/textbooks/user/favorites');
      if (response.data.success) {
        setFavorites(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = (textbookId, isFavorited) => {
    if (!isFavorited) {
      setFavorites(prev => prev.filter(textbook => textbook._id !== textbookId));
    } else {
      fetchFavorites();
    }
  };

  const styles = {
    pageContainer: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
    },
    card: {
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      padding: '30px',
      border: '2px solid #e2e8f0',
    },
    loginCard: {
      maxWidth: '500px',
      width: '100%',
      background: 'linear-gradient(135deg, #ffffff 0%, #fef3c7 100%)',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
      padding: '40px',
      border: '2px solid #fde68a',
      textAlign: 'center',
    },
    iconCircle: {
      width: '80px',
      height: '80px',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 20px',
      boxShadow: '0 10px 20px rgba(245, 158, 11, 0.2)',
    },
    title: {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '10px',
    },
    subtitle: {
      fontSize: '18px',
      color: '#6b7280',
      marginBottom: '20px',
    },
    button: {
      display: 'block',
      width: '100%',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      color: 'white',
      padding: '16px',
      borderRadius: '16px',
      fontWeight: 'bold',
      fontSize: '18px',
      textDecoration: 'none',
      textAlign: 'center',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)',
      transition: 'all 0.3s ease',
    },
    buttonHover: {
      background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 15px 30px rgba(59, 130, 246, 0.3)',
    },
    secondaryButton: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
      color: '#374151',
      borderRadius: '12px',
      fontWeight: '600',
      textDecoration: 'none',
      border: '2px solid #d1d5db',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-block',
    },
    primaryButton: {
      padding: '12px 24px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      borderRadius: '12px',
      fontWeight: '600',
      textDecoration: 'none',
      border: '2px solid #34d399',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'inline-block',
    },
    header: {
      marginBottom: '40px',
    },
    headerContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '25px',
      marginBottom: '25px',
    },
    iconWrapper: {
      padding: '20px',
      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      borderRadius: '20px',
      boxShadow: '0 10px 20px rgba(239, 68, 68, 0.1)',
    },
    buttonGroup: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
      marginTop: '30px',
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '60px',
      background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      border: '2px solid #dbeafe',
      marginBottom: '30px',
    },
    spinner: {
      width: '80px',
      height: '80px',
      border: '6px solid #dbeafe',
      borderTop: '6px solid #3b82f6',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 25px',
      position: 'relative',
    },
    spinnerIcon: {
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      color: '#3b82f6',
    },
    emptyState: {
      background: 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)',
      borderRadius: '24px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      padding: '60px',
      textAlign: 'center',
      border: '2px solid #fecaca',
      marginBottom: '30px',
    },
    emptyIcon: {
      display: 'inline-block',
      padding: '30px',
      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
      borderRadius: '50%',
      boxShadow: '0 15px 30px rgba(239, 68, 68, 0.15)',
      marginBottom: '25px',
    },
    statsCard: {
      background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
      borderRadius: '20px',
      padding: '25px',
      border: '2px solid #dbeafe',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      marginBottom: '30px',
    },
    statsHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statsIcon: {
      padding: '15px',
      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
      borderRadius: '15px',
      boxShadow: '0 8px 16px rgba(59, 130, 246, 0.1)',
    },
    statsCount: {
      fontSize: '36px',
      fontWeight: 'bold',
      color: '#3b82f6',
      textAlign: 'right',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '25px',
      marginBottom: '30px',
    },
    footer: {
      marginTop: '40px',
      paddingTop: '30px',
      borderTop: '1px solid #e5e7eb',
    },
    footerContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    '@media (min-width: 640px)': {
      grid: {
        gridTemplateColumns: 'repeat(2, 1fr)',
      },
      footerContent: {
        flexDirection: 'row',
      },
    },
    '@media (min-width: 1024px)': {
      grid: {
        gridTemplateColumns: 'repeat(3, 1fr)',
      },
    },
  };

  // Add CSS animation for spinner
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `, styleSheet.cssRules.length);

  if (!authService.isAuthenticated()) {
    return (
      <div style={styles.pageContainer}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <div style={styles.loginCard}>
            <div style={styles.iconCircle}>
              <span style={{ fontSize: '36px', color: '#d97706' }}>🔒</span>
            </div>
            <h3 style={{ ...styles.title, color: '#92400e' }}>Login Required</h3>
            <p style={{ ...styles.subtitle, color: '#d97706' }}>Please login to view your favorite textbooks.</p>
            <Link 
              to="/login" 
              style={styles.button}
              onMouseEnter={(e) => {
                e.target.style.background = styles.buttonHover.background;
                e.target.style.transform = styles.buttonHover.transform;
                e.target.style.boxShadow = styles.buttonHover.boxShadow;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = styles.button.background;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = styles.button.boxShadow;
              }}
            >
              Go to Login →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.iconWrapper}>
              <span style={{ fontSize: '32px', color: '#dc2626' }}>❤️</span>
            </div>
            <div>
              <h1 style={styles.title}>My Favorite Textbooks</h1>
              <p style={styles.subtitle}>Textbooks you've saved for later</p>
            </div>
          </div>
          
          <div style={styles.buttonGroup}>
            <Link
              to="/textbooks"
              style={styles.secondaryButton}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = styles.secondaryButton.background;
                e.target.style.transform = 'translateY(0)';
              }}
            >
              ← Back to Marketplace
            </Link>
            <Link
              to="/textbooks/create"
              style={styles.primaryButton}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = styles.primaryButton.background;
                e.target.style.transform = 'translateY(0)';
              }}
            >
              + List New Textbook
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={{ position: 'relative' }}>
              <div style={styles.spinner}></div>
              <div style={styles.spinnerIcon}>
                <span>📚</span>
              </div>
            </div>
            <h3 style={{ ...styles.title, fontSize: '28px' }}>Loading Your Favorites</h3>
            <p style={styles.subtitle}>Please wait while we fetch your saved textbooks...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <span style={{ fontSize: '48px' }}>❤️</span>
            </div>
            <h3 style={{ ...styles.title, fontSize: '28px' }}>No Favorites Yet</h3>
            <p style={{ ...styles.subtitle, maxWidth: '500px', margin: '0 auto 30px' }}>
              Start browsing textbooks and click the heart icon to add them to your favorites
            </p>
            <Link
              to="/textbooks"
              style={{
                ...styles.button,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '15px',
                width: 'auto',
                padding: '18px 40px',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = styles.buttonHover.background;
                e.target.style.transform = styles.buttonHover.transform;
                e.target.style.boxShadow = styles.buttonHover.boxShadow;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = styles.button.background;
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = styles.button.boxShadow;
              }}
            >
              <span style={{ fontSize: '20px' }}>🔍</span>
              Browse Textbooks
            </Link>
          </div>
        ) : (
          <>
            <div style={styles.statsCard}>
              <div style={styles.statsHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={styles.statsIcon}>
                    <span style={{ fontSize: '24px', color: '#3b82f6' }}>📊</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>Favorite Stats</h3>
                    <p style={{ color: '#6b7280' }}>Your saved textbooks overview</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={styles.statsCount}>{favorites.length}</div>
                  <div style={{ color: '#6b7280' }}>Total Favorites</div>
                </div>
              </div>
            </div>

            <div style={{...styles.grid, ...styles['@media (min-width: 640px)'].grid, ...styles['@media (min-width: 1024px)'].grid}}>
              {favorites.map(textbook => (
                <TextbookCard
                  key={textbook._id}
                  textbook={textbook}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>

            <div style={styles.footer}>
              <div style={{...styles.footerContent, ...styles['@media (min-width: 640px)'].footerContent}}>
                <p style={{ fontSize: '18px', color: '#4b5563' }}>
                  Showing <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{favorites.length}</span> favorite {favorites.length === 1 ? 'textbook' : 'textbooks'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <Link
                    to="/textbooks"
                    style={{
                      ...styles.secondaryButton,
                      padding: '12px 24px',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = styles.secondaryButton.background;
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    View More Textbooks
                  </Link>
                  <button
                    onClick={fetchFavorites}
                    style={{
                      ...styles.primaryButton,
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      color: '#1e40af',
                      border: '2px solid #93c5fd',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    Refresh List
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;