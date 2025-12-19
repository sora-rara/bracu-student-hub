import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../api/axios.jsx';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EditFoodItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [foodItem, setFoodItem] = useState({
        name: '',
        description: '',
        shortDescription: '',
        price: '',
        quantity: 0,
        category: 'main_course',
        mealTime: 'lunch',
        dietaryTags: [],
        image: null,
        status: 'active',
        featured: false,
    });
    const [selectedImagePreview, setSelectedImagePreview] = useState(null);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);

    useEffect(() => {
        const fetchFoodItem = async () => {
            try {
                setLoading(true);
                console.log(`📡 Fetching food item with ID: ${id}`);
                const response = await axios.get(`/cafeteria/admin/food-items/${id}`);
                console.log('📥 Response:', response.data);
                
                if (response.data?.success) {
                    const item = response.data.data?.foodItem || response.data?.foodItem;
                    console.log('📦 Food item data:', item);
                    
                    // Transform the data to match our state structure
                    const transformedItem = {
                        name: item.name || '',
                        description: item.description || '',
                        shortDescription: item.shortDescription || '',
                        price: item.price || '',
                        quantity: item.quantity || 0,
                        category: item.category || 'main_course',
                        mealTime: item.mealTime || 'lunch',
                        dietaryTags: Array.isArray(item.dietaryTags) ? item.dietaryTags : [],
                        image: null, // We'll handle image separately
                        status: item.status || 'active',
                        featured: item.featured || false,
                    };
                    
                    setFoodItem(transformedItem);
                    
                    // Handle image
                    if (item.image) {
                        let imageUrl;
                        if (item.image.startsWith('http')) {
                            imageUrl = item.image;
                        } else if (item.image.startsWith('/uploads/')) {
                            imageUrl = `${BASE_URL.replace('/api', '')}${item.image}`;
                        } else {
                            imageUrl = `${BASE_URL.replace('/api', '')}/uploads/${item.image}`;
                        }
                        setCurrentImageUrl(imageUrl);
                        setSelectedImagePreview(imageUrl);
                    }
                } else {
                    throw new Error('Failed to fetch food item');
                }
            } catch (error) {
                console.error('❌ Error fetching food item:', error);
                alert('Failed to load food item: ' + (error.response?.data?.message || error.message));
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };

        fetchFoodItem();
    }, [id, navigate]);

    // --- Image upload handler ---
    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            alert('File size must be less than 5MB');
            return;
        }

        if (!file.type.match('image.*')) {
            alert('Please choose an image file');
            return;
        }

        setFoodItem(prev => ({ ...prev, image: file }));
        setSelectedImagePreview(URL.createObjectURL(file));
    };

    // --- Dietary tag toggle ---
    const handleDietaryTagChange = (tag) => {
        setFoodItem(prev => {
            const currentTags = Array.isArray(prev.dietaryTags) ? [...prev.dietaryTags] : [];
            if (currentTags.includes(tag)) return { ...prev, dietaryTags: currentTags.filter(t => t !== tag) };
            return { ...prev, dietaryTags: [...currentTags, tag] };
        });
    };

    // --- Input change handler ---
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFoodItem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // --- Submit food item ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        console.log('📝 Starting form submission...');

        // Basic validation
        if (!foodItem.name.trim()) {
            alert('Please enter food item name');
            return;
        }
        if (!foodItem.price || isNaN(foodItem.price) || parseFloat(foodItem.price) <= 0) {
            alert('Please enter a valid price');
            return;
        }

        console.log('✅ Validation passed, preparing FormData...');
        console.log('📦 Food item data:', foodItem);

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', foodItem.name);
            formData.append('description', foodItem.description || '');
            formData.append('shortDescription', foodItem.shortDescription || '');
            formData.append('price', foodItem.price);
            formData.append('quantity', String(foodItem.quantity || 0));
            formData.append('category', foodItem.category);
            formData.append('mealTime', foodItem.mealTime);
            formData.append('status', foodItem.status);
            formData.append('featured', String(foodItem.featured));

            if (Array.isArray(foodItem.dietaryTags) && foodItem.dietaryTags.length > 0) {
                formData.append('dietaryTags', foodItem.dietaryTags.join(','));
            }

            if (foodItem.image instanceof File) {
                console.log('📸 New image file:', foodItem.image.name, foodItem.image.size, foodItem.image.type);
                formData.append('image', foodItem.image);
            } else {
                console.log('ℹ️ No new image selected, keeping existing image');
            }

            // Log FormData contents
            console.log('📋 FormData entries:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value);
            }

            console.log(`🚀 Sending PUT request to /cafeteria/admin/food-items/${id}`);

            const response = await axios.put(`/cafeteria/admin/food-items/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            console.log('✅ Response received:', response.data);

            if (response.data?.success) {
                alert('✅ Food item updated successfully!');
                navigate('/admin');
            } else {
                console.error('❌ Server returned success: false', response.data);
                alert('❌ Failed: ' + (response.data?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error updating food item:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);

            if (error.response?.status === 401) {
                alert('Session expired. Please log in again.');
                navigate('/login');
            } else if (error.response?.status === 403) {
                alert('Admin access required. Please log in as admin.');
                navigate('/login');
            } else {
                alert('Failed to update food item: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin');
    };

    if (loading) {
        return (
            <div className="page-container">
                <div className="loading-screen">
                    <h2>Loading Food Item...</h2>
                    <p>Please wait while we fetch the item details</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="admin-header">
                <h1>✏️ Edit Food Item</h1>
                <p>Update "{foodItem.name}"</p>
                <div className="header-actions">
                    <button className="btn outline-btn" onClick={handleCancel}>
                        ← Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="food-item-form-container">
                <form onSubmit={handleSubmit} className="food-form">
                    {/* Basic Info Section */}
                    <div className="form-section basic-info-section">
                        <h3>Basic Information</h3>
                        <div className="form-grid">
                            <div className="form-group required-field">
                                <label htmlFor="name">Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={foodItem.name}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                    disabled={submitting}
                                    placeholder="Enter food item name"
                                />
                            </div>

                            <div className="form-group required-field">
                                <label htmlFor="category">Category *</label>
                                <select 
                                    id="category"
                                    name="category" 
                                    value={foodItem.category} 
                                    onChange={handleInputChange} 
                                    className="form-control" 
                                    required 
                                    disabled={submitting}
                                >
                                    <option value="main_course">Main Course</option>
                                    <option value="appetizer">Appetizer</option>
                                    <option value="dessert">Dessert</option>
                                    <option value="beverage">Beverage</option>
                                    <option value="side_dish">Side Dish</option>
                                    <option value="snack">Snack</option>
                                </select>
                            </div>

                            <div className="form-group required-field">
                                <label htmlFor="mealTime">Meal Time *</label>
                                <select 
                                    id="mealTime"
                                    name="mealTime" 
                                    value={foodItem.mealTime} 
                                    onChange={handleInputChange} 
                                    className="form-control" 
                                    required 
                                    disabled={submitting}
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snacks">Snacks</option>
                                </select>
                            </div>

                            <div className="form-group required-field price-input-group">
                                <label htmlFor="price">Price (৳) *</label>
                                <div className="price-input-wrapper">
                                    <span className="currency-symbol">৳</span>
                                    <input
                                        type="number"
                                        id="price"
                                        name="price"
                                        step="0.01"
                                        min="0"
                                        value={foodItem.price}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        required
                                        disabled={submitting}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description Section */}
                    <div className="form-section description-section">
                        <h3>Description</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="shortDescription">Short Description</label>
                                <input
                                    type="text"
                                    id="shortDescription"
                                    name="shortDescription"
                                    value={foodItem.shortDescription}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    disabled={submitting}
                                    placeholder="Brief description (max 100 characters)"
                                    maxLength="100"
                                />
                                <div className="char-count">
                                    {foodItem.shortDescription.length}/100
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Full Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={foodItem.description}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    rows="4"
                                    disabled={submitting}
                                    placeholder="Detailed description of the food item"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quantity Section */}
                    <div className="form-section">
                        <h3>Inventory</h3>
                        <div className="form-group">
                            <label htmlFor="quantity">Quantity Available</label>
                            <div className="quantity-input-group">
                                <button 
                                    type="button" 
                                    className="quantity-btn" 
                                    onClick={() => setFoodItem(prev => ({ ...prev, quantity: Math.max(0, prev.quantity - 1) }))}
                                    disabled={submitting}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    id="quantity"
                                    name="quantity"
                                    min="0"
                                    value={foodItem.quantity}
                                    onChange={handleInputChange}
                                    className="form-control quantity-input"
                                    disabled={submitting}
                                />
                                <button 
                                    type="button" 
                                    className="quantity-btn" 
                                    onClick={() => setFoodItem(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                                    disabled={submitting}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Status Section */}
                    <div className="form-section">
                        <h3>Status</h3>
                        <div className="status-radio-group">
                            <label className={`status-option ${foodItem.status === 'active' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="status"
                                    value="active"
                                    checked={foodItem.status === 'active'}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                />
                                <span className="status-label">Active</span>
                                <small className="status-help">Visible to students</small>
                            </label>
                            <label className={`status-option ${foodItem.status === 'inactive' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="status"
                                    value="inactive"
                                    checked={foodItem.status === 'inactive'}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                />
                                <span className="status-label">Inactive</span>
                                <small className="status-help">Hidden from students</small>
                            </label>
                            <label className={`status-option ${foodItem.status === 'out_of_stock' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="status"
                                    value="out_of_stock"
                                    checked={foodItem.status === 'out_of_stock'}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                />
                                <span className="status-label">Out of Stock</span>
                                <small className="status-help">Temporarily unavailable</small>
                            </label>
                        </div>
                    </div>

                    {/* Dietary Tags Section */}
                    <div className="form-section dietary-tags-section">
                        <h3>Dietary Tags</h3>
                        <p className="help-text">Select all applicable dietary tags for this food item</p>
                        <div className="tags-grid">
                            {['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'spicy'].map(tag => (
                                <label 
                                    key={tag} 
                                    className={`tag-option ${foodItem.dietaryTags.includes(tag) ? 'selected' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={foodItem.dietaryTags.includes(tag)}
                                        onChange={() => handleDietaryTagChange(tag)}
                                        disabled={submitting}
                                    />
                                    <span>{tag.replace('_', ' ').toUpperCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="form-section image-section">
                        <h3>Food Image</h3>
                        <div className="image-upload-section">
                            <label className="file-upload-area">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={submitting}
                                />
                                <div className="file-upload-label">
                                    📸 Change Image
                                </div>
                            </label>
                            <p className="file-help-text">
                                Upload a new image to replace the current one<br />
                                Max file size: 5MB | Supported formats: JPG, PNG, WebP
                            </p>
                            
                            {(selectedImagePreview || currentImageUrl) && (
                                <div className="image-preview-container">
                                    <h4>Current Image:</h4>
                                    <img 
                                        src={selectedImagePreview || currentImageUrl} 
                                        alt="Food Preview" 
                                        className="image-preview" 
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                                        }}
                                    />
                                    <p className="image-info">
                                        {selectedImagePreview && foodItem.image instanceof File 
                                            ? `New image: ${foodItem.image.name} (${(foodItem.image.size / 1024).toFixed(1)} KB)` 
                                            : 'Current image will be kept'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Featured Item Section */}
                    <div className="form-section featured-item-section">
                        <h3>Featured Item</h3>
                        <div className="toggle-container">
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    name="featured"
                                    checked={foodItem.featured}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                />
                                <span className="toggle-slider"></span>
                            </label>
                            <span className="toggle-label">
                                Mark as Featured Item
                                <br />
                                <small>Featured items appear prominently on the menu</small>
                            </span>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Updating Food Item...
                                </>
                            ) : (
                                '💾 Update Food Item'
                            )}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-outline" 
                            onClick={handleCancel}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditFoodItem;