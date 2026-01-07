import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import authService from '../../services/auth';
import FilterSidebar from './FilterSidebar';
import TextbookCard from './TextbookCard';
import StatsCard from './StatsCard';

const TextbookExchange = () => {
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    courseCode: '',
    condition: '',
    transactionType: '',
    minPrice: '',
    maxPrice: '',
    status: 'Available',
    sellerId: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [itemsPerPage] = useState(12);
  const [uniqueCourses, setUniqueCourses] = useState([]);
  const [stats, setStats] = useState(null);
  
  const navigate = useNavigate();

  // Extract URL parameters for pre-filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const course = urlParams.get('course');
    const seller = urlParams.get('seller');
    
    if (course) {
      setFilters(prev => ({ ...prev, courseCode: course }));
    }
    if (seller) {
      setFilters(prev => ({ ...prev, sellerId: seller }));
    }
  }, []);

  useEffect(() => {
    fetchTextbooks();
    fetchStats();
  }, []);

  const fetchTextbooks = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/textbooks');
      if (response.data.success) {
        setTextbooks(response.data.data);
        
        // Extract unique courses from fetched textbooks
        const courses = [...new Set(response.data.data
          .filter(t => t.courseCode)
          .map(t => t.courseCode)
          .sort()
        )];
        setUniqueCourses(courses);
      } else {
        setError(response.data.error);
      }
    } catch (error) {
      console.error('Error fetching textbooks:', error);
      setError('Failed to load textbooks. Please try again.');
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
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      courseCode: '',
      condition: '',
      transactionType: '',
      minPrice: '',
      maxPrice: '',
      status: 'Available',
      sellerId: ''
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setCurrentPage(1);
  };

  const handleFavoriteToggle = async (textbookId, isCurrentlyFavorited) => {
    if (!authService.isAuthenticated()) {
      alert('Please login to add to favorites');
      navigate('/login');
      return;
    }

    try {
      const response = await axios.post(`/api/textbooks/${textbookId}/toggle-favorite`);
      if (response.data.success) {
        setTextbooks(prev => prev.map(textbook => {
          if (textbook._id === textbookId) {
            const user = authService.getCurrentUser();
            const updatedFavorites = isCurrentlyFavorited
              ? textbook.favorites?.filter(id => id !== user.id) || []
              : [...(textbook.favorites || []), user.id];
            
            return {
              ...textbook,
              favorites: updatedFavorites
            };
          }
          return textbook;
        }));
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      if (error.response?.status === 401) {
        alert('Session expired. Please login again.');
        navigate('/login');
      }
    }
  };

  const handleDelete = async (textbookId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await axios.delete(`/api/textbooks/${textbookId}`);
      setTextbooks(prev => prev.filter(textbook => textbook._id !== textbookId));
      alert('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting textbook:', error);
      alert('Failed to delete listing');
    }
  };

  // Filter and sort textbooks
  const filteredAndSortedTextbooks = textbooks
    .filter(textbook => {
      // Apply course filter
      if (filters.courseCode && textbook.courseCode !== filters.courseCode) return false;
      
      // Apply condition filter
      if (filters.condition && textbook.condition !== filters.condition) return false;
      
      // Apply transaction type filter
      if (filters.transactionType && textbook.transactionType !== filters.transactionType) return false;
      
      // Apply price range filter
      if (filters.minPrice) {
        const minPrice = parseFloat(filters.minPrice);
        if (!isNaN(minPrice) && textbook.price < minPrice) return false;
      }
      if (filters.maxPrice) {
        const maxPrice = parseFloat(filters.maxPrice);
        if (!isNaN(maxPrice) && textbook.price > maxPrice) return false;
      }
      
      // Apply status filter
      if (filters.status === 'Available' && textbook.status !== 'Available') return false;
      
      // Apply seller filter
      if (filters.sellerId && textbook.sellerId?._id !== filters.sellerId) return false;
      
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          textbook.title.toLowerCase().includes(searchLower) ||
          textbook.author.toLowerCase().includes(searchLower) ||
          (textbook.courseCode && textbook.courseCode.toLowerCase().includes(searchLower)) ||
          (textbook.courseName && textbook.courseName.toLowerCase().includes(searchLower)) ||
          (textbook.isbn && textbook.isbn.toLowerCase().includes(searchLower)) ||
          (textbook.tags && textbook.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'popular':
          return (b.favorites?.length || 0) - (a.favorites?.length || 0);
        case 'newest':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTextbooks = filteredAndSortedTextbooks.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAndSortedTextbooks.length / itemsPerPage);

  const handleCreateSuccess = () => {
    // This would be called if we were using the old inline form
    // Now we just redirect to the form page
    navigate('/textbooks/create');
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
              border: '4px solid #e2e8f0',
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
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '15px' }}>Loading Textbooks</h3>
          <p style={{ color: '#6b7280' }}>Fetching the latest listings...</p>
        </div>
      </div>
    );
  }

  const user = authService.getCurrentUser();
  const isAdmin = user && (user.role === 'admin' || user.isAdmin);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '15px' }}>📚 Textbook Exchange</h1>
          <p style={{ color: '#6b7280', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: '30px' }}>
          <form onSubmit={handleSearch} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search textbooks by title, author, course, ISBN, or tags..."
                style={{
                  width: '100%',
                  padding: '16px 20px 16px 55px',
                  backgroundColor: 'white',
                  border: '1px solid #d1d5db',
                  borderRadius: '12px',
                  fontSize: '16px',
                  outline: 'none',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              />
              <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                type="submit"
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '10px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', marginBottom: '40px' }}>
          {!isAdmin && (
            <button 
              style={{
                padding: '14px 32px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '12px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '16px'
              }}
              onClick={() => navigate('/textbooks/create')}
            >
              <span>📝</span>
              List a Textbook
            </button>
          )}
          <button 
            style={{
              padding: '14px 32px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              borderRadius: '12px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '16px'
            }}
            onClick={handleClearFilters}
          >
            <span>🗑️</span>
            Clear All Filters
          </button>
          {authService.isAuthenticated() && (
            <>
              <Link 
                to="/textbooks/my-listings"
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '16px',
                  textDecoration: 'none'
                }}
              >
                <span>📋</span>
                My Listings
              </Link>
              <Link 
                to="/textbooks/favorites"
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '16px',
                  textDecoration: 'none'
                }}
              >
                <span>❤️</span>
                My Favorites
              </Link>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', '@media (min-width: 1024px)': { gridTemplateColumns: '1fr 3fr' } }}>
          {/* Left Column - Filters & Stats */}
          <div>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', padding: '25px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>🔍</span>
                Filters
              </h3>
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>
            
            {/* Stats Card */}
            {stats && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', padding: '25px', border: '1px solid #e5e7eb' }}>
                <StatsCard stats={stats} />
              </div>
            )}
          </div>

          {/* Right Column - Textbook Listings */}
          <div>
            {/* Results Header */}
            <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', padding: '25px', border: '1px solid #e5e7eb', marginBottom: '25px' }}>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '20px',
                marginBottom: '20px',
                '@media (min-width: 640px)': {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }
              }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>Available Textbooks</h2>
                  <p style={{ color: '#6b7280', marginTop: '5px' }}>
                    {filteredAndSortedTextbooks.length} {filteredAndSortedTextbooks.length === 1 ? 'listing' : 'listings'} found
                    {searchTerm && ` for "${searchTerm}"`}
                    {filters.courseCode && ` in ${filters.courseCode}`}
                  </p>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '15px',
                  '@media (min-width: 640px)': {
                    flexDirection: 'row',
                    alignItems: 'center'
                  }
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#4b5563', fontWeight: '500' }}>Sort by:</span>
                    <select 
                      style={{
                        padding: '10px 15px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        color: '#374151',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                      value={sortBy}
                      onChange={handleSortChange}
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="popular">Most Popular</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => setFilters(prev => ({ 
                      ...prev, 
                      status: prev.status === 'Available' ? 'All' : 'Available' 
                    }))}
                    style={{
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontWeight: '500',
                      border: '1px solid',
                      backgroundColor: filters.status === 'Available' ? '#d1fae5' : '#f3f4f6',
                      color: filters.status === 'Available' ? '#065f46' : '#374151',
                      borderColor: filters.status === 'Available' ? '#a7f3d0' : '#d1d5db',
                      cursor: 'pointer'
                    }}
                  >
                    {filters.status === 'Available' ? '✓ Available Only' : 'Show All Status'}
                  </button>
                </div>
              </div>
            </div>

            {/* Textbook Cards Grid */}
            {currentTextbooks.length > 0 ? (
              <>
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '25px',
                  '@media (min-width: 640px)': {
                    gridTemplateColumns: 'repeat(2, 1fr)'
                  },
                  '@media (min-width: 1024px)': {
                    gridTemplateColumns: 'repeat(3, 1fr)'
                  }
                }}>
                  {currentTextbooks.map(textbook => (
                    <TextbookCard
                      key={textbook._id}
                      textbook={textbook}
                      onFavoriteToggle={handleFavoriteToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {filteredAndSortedTextbooks.length > itemsPerPage && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '25px', marginTop: '40px' }}>
                    <button
                      style={{
                        padding: '10px 20px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        opacity: currentPage === 1 ? 0.5 : 1
                      }}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      ← Previous
                    </button>
                    
                    <span style={{ color: '#4b5563', fontWeight: '500' }}>
                      Page <span style={{ fontWeight: 'bold' }}>{currentPage}</span> of <span style={{ fontWeight: 'bold' }}>{totalPages}</span>
                    </span>
                    
                    <button
                      style={{
                        padding: '10px 20px',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontWeight: '500',
                        color: '#374151',
                        cursor: 'pointer',
                        opacity: currentPage === totalPages ? 0.5 : 1
                      }}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '12px', 
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)', 
                padding: '50px', 
                textAlign: 'center',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '60px', marginBottom: '25px', color: '#d1d5db' }}>📚</div>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '15px' }}>
                  {searchTerm || Object.values(filters).some(f => f)
                    ? 'No textbooks match your search'
                    : 'No textbooks listed yet'}
                </h3>
                <p style={{ color: '#6b7280', marginBottom: '30px', maxWidth: '500px', margin: '0 auto' }}>
                  {searchTerm || Object.values(filters).some(f => f)
                    ? 'Try adjusting your search terms or filters to find what you\'re looking for.'
                    : 'Be the first to list a textbook and help your fellow students!'}
                </p>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '15px',
                  justifyContent: 'center',
                  '@media (min-width: 640px)': {
                    flexDirection: 'row'
                  }
                }}>
                  <button 
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      borderRadius: '8px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      if (searchTerm || Object.values(filters).some(f => f)) {
                        handleClearFilters();
                      } else {
                        navigate('/textbooks/create');
                      }
                    }}
                  >
                    {searchTerm || Object.values(filters).some(f => f)
                      ? 'Clear Search & Filters'
                      : 'List First Textbook'}
                  </button>
                  <Link
                    to="/textbooks"
                    onClick={handleClearFilters}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      borderRadius: '8px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    View All Textbooks
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextbookExchange;