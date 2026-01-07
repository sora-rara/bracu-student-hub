import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from '../../api/axios';
import TextbookCard from '../Textbook/TextbookCard';
import FilterSidebar from '../Textbook/FilterSidebar';
import StatsCard from '../Textbook/StatsCard';

const TextbookListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    courseCode: searchParams.get('course') || '',
    transactionType: searchParams.get('type') || '',
    condition: searchParams.get('condition') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    status: 'Available',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchTextbooks();
    fetchStats();
  }, [searchParams]);

  const fetchTextbooks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams);
      params.set('status', 'Available');
      
      const response = await axios.get(`/api/textbooks?${params}`);
      if (response.data.success) {
        setTextbooks(response.data.data);
        setPagination(response.data.pagination);
      } else {
        setError(response.data.error);
      }
    } catch (error) {
      console.error('Error fetching textbooks:', error);
      setError('Failed to load textbooks');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/textbooks/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    const params = {};
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && key !== 'status') {
        params[key] = value;
      }
    });
    setSearchParams(params);
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params);
  };

  const handleFavoriteToggle = (textbookId, isFavorited) => {
    setTextbooks(prev =>
      prev.map(textbook =>
        textbook._id === textbookId
          ? {
              ...textbook,
              favorites: isFavorited
                ? [...textbook.favorites, 'temp-user-id']
                : textbook.favorites.filter(id => id !== 'temp-user-id')
            }
          : textbook
      )
    );
  };

  const handleDelete = (textbookId) => {
    setTextbooks(prev => prev.filter(textbook => textbook._id !== textbookId));
  };

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        padding: '16px'
      }}>
        <div style={{
          maxWidth: '448px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '32px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <span style={{ fontSize: '24px', color: '#dc2626' }}>⚠️</span>
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Error Loading Textbooks</h3>
            <p style={{ color: '#4b5563' }}>{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              width: '100%',
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '12px',
              borderRadius: '8px',
              fontWeight: '500',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Hero Section */}
      <div style={{ backgroundColor: '#2563eb', color: 'white' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 48px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            '@media (min-width: 1024px)': { flexDirection: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px'
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                  <span style={{ fontSize: '24px' }}>📚</span>
                </div>
                <div>
                  <h1 style={{ fontSize: '30px', fontWeight: 'bold', marginBottom: '8px' }}>Textbook Exchange</h1>
                  <p style={{ color: '#bfdbfe' }}>Buy, sell, or exchange textbooks with BRAC University students</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <Link
                  to="/textbooks/create"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    color: '#2563eb',
                    borderRadius: '8px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>📝</span>
                  List a Textbook
                </Link>
                <Link
                  to="/textbooks/my-listings"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#1d4ed8',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>📋</span>
                  My Listings
                </Link>
                <Link
                  to="/textbooks/favorites"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    borderRadius: '8px',
                    fontWeight: '500',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>❤️</span>
                  My Favorites
                </Link>
              </div>
            </div>
            
            <div style={{ display: 'none', '@media (min-width: 1024px)': { display: 'block' } }}>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🏫</div>
                <div style={{ fontWeight: 'bold' }}>BRAC University</div>
                <div style={{ color: '#bfdbfe', fontSize: '14px' }}>Student Marketplace</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
          '@media (min-width: 1024px)': { gridTemplateColumns: '1fr 3fr' }
        }}>
          {/* Left Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>Filters</h2>
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={() => {
                  setSearchParams({});
                  setFilters({
                    search: '',
                    courseCode: '',
                    transactionType: '',
                    condition: '',
                    minPrice: '',
                    maxPrice: '',
                    status: 'Available',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  });
                }}
              />
            </div>
            
            {stats && (
              <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '16px', border: '1px solid #e5e7eb' }}>
                <StatsCard stats={stats} />
              </div>
            )}
          </div>

          {/* Main Content */}
          <div>
            {/* Search Bar */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search textbooks by title, author, course code, ISBN..."
                  value={filters.search}
                  onChange={(e) => {
                    const newFilters = { ...filters, search: e.target.value };
                    setFilters(newFilters);
                    if (e.target.value === '') {
                      handleFilterChange(newFilters);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleFilterChange(filters);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 40px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <button
                  onClick={() => handleFilterChange(filters)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '6px 16px',
                    borderRadius: '4px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Search
                </button>
              </div>
            </div>

            {/* Sort Options */}
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                '@media (min-width: 640px)': {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }
              }}>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#111827' }}>
                  📚 Showing <span style={{ color: '#2563eb' }}>{textbooks.length}</span> of <span style={{ color: '#2563eb' }}>{pagination.total || 0}</span> textbooks
                </div>
                <div style={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  '@media (min-width: 640px)': {
                    flexDirection: 'row',
                    alignItems: 'center'
                  }
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: '#374151' }}>Sort by:</span>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => {
                        const newFilters = { ...filters, sortBy: e.target.value };
                        setFilters(newFilters);
                        handleFilterChange(newFilters);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        fontSize: '14px'
                      }}
                    >
                      <option value="createdAt">Newest First</option>
                      <option value="price">Price: Low to High</option>
                      <option value="-price">Price: High to Low</option>
                      <option value="title">Title: A-Z</option>
                      <option value="-title">Title: Z-A</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => {
                        const newFilters = { ...filters, transactionType: 'Sell' };
                        setFilters(newFilters);
                        handleFilterChange(newFilters);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontWeight: '500',
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: filters.transactionType === 'Sell' ? '#2563eb' : '#f3f4f6',
                        color: filters.transactionType === 'Sell' ? 'white' : '#374151'
                      }}
                    >
                      💰 For Sale
                    </button>
                    <button
                      onClick={() => {
                        const newFilters = { ...filters, transactionType: 'Exchange' };
                        setFilters(newFilters);
                        handleFilterChange(newFilters);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontWeight: '500',
                        fontSize: '14px',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: filters.transactionType === 'Exchange' ? '#059669' : '#f3f4f6',
                        color: filters.transactionType === 'Exchange' ? 'white' : '#374151'
                      }}
                    >
                      🔄 For Exchange
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Textbook Grid */}
            {loading ? (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '16px',
                '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
                '@media (min-width: 1024px)': { gridTemplateColumns: 'repeat(3, 1fr)' }
              }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} style={{ 
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #e5e7eb',
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}>
                    <div style={{ height: '192px', backgroundColor: '#e5e7eb', borderRadius: '8px', marginBottom: '16px' }}></div>
                    <div style={{ height: '16px', backgroundColor: '#e5e7eb', borderRadius: '4px', marginBottom: '8px' }}></div>
                    <div style={{ height: '12px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '75%', marginBottom: '16px' }}></div>
                    <div style={{ height: '24px', backgroundColor: '#e5e7eb', borderRadius: '4px', width: '50%' }}></div>
                  </div>
                ))}
              </div>
            ) : textbooks.length === 0 ? (
              <div style={{ 
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'inline-block', padding: '16px', backgroundColor: '#dbeafe', borderRadius: '50%', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>📚</span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '8px' }}>No Textbooks Found</h3>
                <p style={{ color: '#4b5563', marginBottom: '24px', maxWidth: '448px', margin: '0 auto' }}>
                  {filters.search || filters.courseCode || filters.transactionType
                    ? 'Try adjusting your filters or search terms'
                    : 'Be the first to list a textbook in our marketplace!'}
                </p>
                <Link
                  to="/textbooks/create"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontWeight: '500',
                    textDecoration: 'none'
                  }}
                >
                  <span>📝</span>
                  List Your First Textbook
                </Link>
              </div>
            ) : (
              <>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '16px',
                  '@media (min-width: 640px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
                  '@media (min-width: 1024px)': { gridTemplateColumns: 'repeat(3, 1fr)' }
                }}>
                  {textbooks.map((textbook) => (
                    <TextbookCard
                      key={textbook._id}
                      textbook={textbook}
                      onFavoriteToggle={handleFavoriteToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          backgroundColor: 'white',
                          cursor: pagination.page === 1 ? 'not-allowed' : 'pointer',
                          opacity: pagination.page === 1 ? 0.5 : 1,
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        ← Previous
                      </button>
                      
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        let pageNum;
                        if (pagination.pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 2) {
                          pageNum = pagination.pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '4px',
                              border: '1px solid',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              backgroundColor: pagination.page === pageNum ? '#2563eb' : 'white',
                              color: pagination.page === pageNum ? 'white' : '#374151',
                              borderColor: pagination.page === pageNum ? '#2563eb' : '#d1d5db'
                            }}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          backgroundColor: 'white',
                          cursor: pagination.page === pagination.pages ? 'not-allowed' : 'pointer',
                          opacity: pagination.page === pagination.pages ? 0.5 : 1,
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        Next →
                      </button>
                    </nav>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextbookListPage;
