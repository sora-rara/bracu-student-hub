import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';

const TextbookAdminPanel = () => {
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [selectedTextbook, setSelectedTextbook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchAllTextbooks();
    fetchAdminStats();
  }, [statusFilter]);

  const fetchAllTextbooks = async () => {
    try {
      setLoading(true);
      let url = '/api/textbooks?limit=100';
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const response = await axios.get(url);
      if (response.data.success) {
        setTextbooks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching textbooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const response = await axios.get('/api/textbooks/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleStatusUpdate = async (textbookId, newStatus) => {
    try {
      await axios.patch(`/api/textbooks/${textbookId}/status`, { status: newStatus });
      fetchAllTextbooks();
      alert('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (textbookId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await axios.delete(`/api/textbooks/${textbookId}`);
      fetchAllTextbooks();
      alert('Listing deleted successfully');
    } catch (error) {
      console.error('Error deleting textbook:', error);
      alert('Failed to delete listing');
    }
  };

  const handleToggleFeatured = async (textbookId, currentFeatured) => {
    try {
      await axios.put(`/api/textbooks/${textbookId}`, { featured: !currentFeatured });
      fetchAllTextbooks();
      alert('Featured status updated');
    } catch (error) {
      console.error('Error updating featured status:', error);
    }
  };

  const filteredTextbooks = textbooks.filter(textbook =>
    textbook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    textbook.sellerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    textbook.courseCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getImageUrl = (image) => {
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (!image) return null;
    if (image.startsWith('http')) return image;
    return `${BASE_URL}/uploads/textbooks/${image}`;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', color: '#333', marginBottom: '10px' }}>📚 Textbook Exchange Admin Panel</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>Manage all textbook listings - View, delete, or update status</p>
      </div>

      {/* Stats Overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Listings</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.overall?.totalListings || 0}</div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Available</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            {textbooks.filter(t => t.status === 'Available').length}
          </div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Featured</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6f42c1' }}>
            {textbooks.filter(t => t.featured).length}
          </div>
        </div>
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Views</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#007bff' }}>
            {textbooks.reduce((sum, t) => sum + (t.viewCount || 0), 0)}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <div style={{ fontSize: '14px', color: '#495057', marginBottom: '5px', fontWeight: '500' }}>Search</div>
            <input
              type="text"
              placeholder="Search by title, seller email, or course code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <div style={{ fontSize: '14px', color: '#495057', marginBottom: '5px', fontWeight: '500' }}>Status Filter</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                outline: 'none'
              }}
            >
              <option value="all">All Status</option>
              <option value="Available">Available</option>
              <option value="Pending">Pending</option>
              <option value="Sold">Sold</option>
              <option value="Exchanged">Exchanged</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={fetchAllTextbooks}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Refresh Data
          </button>
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
            }}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🗑️ Clear Filters
          </button>
        </div>
      </div>

      {/* Textbook List */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #007bff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ color: '#666' }}>Loading textbooks...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Textbook</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Seller</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Price</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#495057', fontSize: '14px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTextbooks.map((textbook) => (
                  <tr key={textbook._id} style={{ borderBottom: '1px solid #e9ecef', backgroundColor: 'white' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ flexShrink: 0, width: '40px', height: '40px', marginRight: '12px' }}>
                          {textbook.images?.[0] ? (
                            <img
                              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                              src={getImageUrl(textbook.images[0])}
                              alt={textbook.title}
                            />
                          ) : (
                            <div style={{ width: '40px', height: '40px', backgroundColor: '#e9ecef', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#6c757d' }}>📚</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#212529' }}>{textbook.title}</div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>{textbook.courseCode || 'No course'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '14px', color: '#212529' }}>{textbook.sellerName}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d' }}>{textbook.sellerEmail}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '20px',
                        fontWeight: '600',
                        backgroundColor: 
                          textbook.status === 'Available' ? '#d4edda' :
                          textbook.status === 'Pending' ? '#fff3cd' : '#f8d7da',
                        color: 
                          textbook.status === 'Available' ? '#155724' :
                          textbook.status === 'Pending' ? '#856404' : '#721c24'
                      }}>
                        {textbook.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#212529', fontWeight: '600' }}>
                      ৳{textbook.price?.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => setSelectedTextbook(textbook)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(textbook._id, textbook.featured)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: textbook.featured ? '#ffc107' : '#6c757d',
                            color: textbook.featured ? '#212529' : 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          {textbook.featured ? '⭐ Unfeature' : 'Mark Featured'}
                        </button>
                        <button
                          onClick={() => handleDelete(textbook._id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Textbook Detail Modal */}
      {selectedTextbook && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '25px',
            width: '80%',
            maxWidth: '900px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333', margin: 0 }}>Textbook Details</h3>
              <button
                onClick={() => setSelectedTextbook(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>Basic Info</h4>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Title:</strong> {selectedTextbook.title}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Author:</strong> {selectedTextbook.author}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Course:</strong> {selectedTextbook.courseCode} - {selectedTextbook.courseName}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>ISBN:</strong> {selectedTextbook.isbn || 'N/A'}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Condition:</strong> {selectedTextbook.condition}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Price:</strong> ৳{selectedTextbook.price?.toFixed(2)}
                </div>
              </div>
              
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>Seller Info</h4>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Name:</strong> {selectedTextbook.sellerName}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Email:</strong> {selectedTextbook.sellerEmail}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Contact:</strong> {selectedTextbook.contactMethod}: {selectedTextbook.contactInfo}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Location:</strong> {selectedTextbook.location}
                </div>
                
                <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginTop: '25px', marginBottom: '15px' }}>Stats</h4>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Views:</strong> {selectedTextbook.viewCount || 0}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Favorites:</strong> {selectedTextbook.favorites?.length || 0}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#495057' }}>Created:</strong> {new Date(selectedTextbook.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
            
            <div style={{ marginTop: '25px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '15px' }}>Description</h4>
              <p style={{ color: '#495057', lineHeight: '1.6' }}>{selectedTextbook.description || 'No description'}</p>
            </div>
            
            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button
                onClick={() => handleStatusUpdate(selectedTextbook._id, 'Available')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#d4edda',
                  color: '#155724',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Mark Available
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedTextbook._id, 'Sold')}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#d1ecf1',
                  color: '#0c5460',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Mark Sold
              </button>
              <button
                onClick={() => handleDelete(selectedTextbook._id)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Delete Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextbookAdminPanel;