import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios.jsx';

const AddFoodItem = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [newFoodItem, setNewFoodItem] = useState({
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

    // Test admin endpoint access on component mount
    useEffect(() => {
        const testAdminAccess = async () => {
            try {
                console.log('🔍 Testing admin access in AddFoodItem...');
                const response = await axios.get('/api/cafeteria/admin/test-auth', {
                    withCredentials: true // ✅ Ensure credentials are sent
                });
                console.log('✅ Admin access confirmed:', response.data);
            } catch (error) {
                console.error('❌ Admin access failed:', error.response?.status);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    alert('Admin access required. Please log in as admin.');
                    navigate('/login');
                }
            }
        };
        testAdminAccess();
    }, [navigate]);

    // --- Test FormData POST ---
    const testFormDataPost = async () => {
        try {
            console.log('🧪 Testing FormData POST...');
            const formData = new FormData();
            formData.append('test', 'data');
            formData.append('timestamp', new Date().toISOString());

            console.log('📦 Sending test FormData to /cafeteria/admin/test-formdata');

            const response = await axios.post('/cafeteria/admin/test-formdata', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true // ✅ Ensure credentials are sent
            });

            console.log('✅ FormData test response:', response.data);
            alert('✅ FormData POST works!\n\nCheck console for details.');
        } catch (error) {
            console.error('❌ FormData test failed:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);

            if (error.response?.status === 401) {
                alert('❌ Session expired. Please log in again.');
            } else if (error.response?.status === 403) {
                alert('❌ Admin access required. Please log in as admin.');
            } else {
                alert('❌ FormData test failed: ' + (error.response?.data?.message || error.message));
            }
        }
    };

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

        setNewFoodItem(prev => ({ ...prev, image: file }));
        setSelectedImagePreview(URL.createObjectURL(file));
    };

    // --- Dietary tag toggle ---
    const handleDietaryTagChange = (tag) => {
        setNewFoodItem(prev => {
            const currentTags = Array.isArray(prev.dietaryTags) ? [...prev.dietaryTags] : [];
            if (currentTags.includes(tag)) return { ...prev, dietaryTags: currentTags.filter(t => t !== tag) };
            return { ...prev, dietaryTags: [...currentTags, tag] };
        });
    };

    // --- Input change handler ---
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewFoodItem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    // --- Submit food item ---
    const handleSubmitFoodItem = async (e) => {
        e.preventDefault();

        console.log('📝 Starting form submission...');

        // Basic validation
        if (!newFoodItem.name.trim()) {
            alert('Please enter food item name');
            return;
        }
        if (!newFoodItem.price || isNaN(newFoodItem.price) || parseFloat(newFoodItem.price) <= 0) {
            alert('Please enter a valid price');
            return;
        }

        console.log('✅ Validation passed, preparing FormData...');
        console.log('📦 Food item data:', newFoodItem);

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', newFoodItem.name);
            formData.append('description', newFoodItem.description || '');
            formData.append('shortDescription', newFoodItem.shortDescription || '');
            formData.append('price', newFoodItem.price);
            formData.append('quantity', String(newFoodItem.quantity || 0));
            formData.append('category', newFoodItem.category);
            formData.append('mealTime', newFoodItem.mealTime);
            formData.append('status', newFoodItem.status);
            formData.append('featured', String(newFoodItem.featured));

            if (Array.isArray(newFoodItem.dietaryTags) && newFoodItem.dietaryTags.length > 0) {
                formData.append('dietaryTags', newFoodItem.dietaryTags.join(','));
            }

            if (newFoodItem.image instanceof File) {
                console.log('📸 Image file:', newFoodItem.image.name, newFoodItem.image.size, newFoodItem.image.type);
                formData.append('image', newFoodItem.image);
            } else {
                console.log('⚠️ No image file selected');
                alert('Please select an image file');
                setLoading(false);
                return;
            }

            // Log FormData contents
            console.log('📋 FormData entries:');
            for (let [key, value] of formData.entries()) {
                console.log(`  ${key}:`, value);
            }

            console.log('🚀 Sending POST request to /cafeteria/admin/food-items');

            const response = await axios.post('/cafeteria/admin/food-items', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true // ✅ Ensure credentials are sent
            });

            console.log('✅ Response received:', response.data);

            if (response.data?.success) {
                alert('✅ Food item added successfully!');
                // Reset form
                setNewFoodItem({
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
                setSelectedImagePreview(null);
                if (fileInputRef.current) fileInputRef.current.value = '';

                // Navigate back to admin dashboard
                navigate('/admin');
            } else {
                console.error('❌ Server returned success: false', response.data);
                alert('❌ Failed: ' + (response.data?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ Error saving food item:', error);
            console.error('❌ Error response:', error.response?.data);
            console.error('❌ Error status:', error.response?.status);

            if (error.response?.status === 401) {
                alert('Session expired. Please log in again.');
                navigate('/login');
            } else if (error.response?.status === 403) {
                alert('Admin access required. Please log in as admin.');
                navigate('/login');
            } else {
                alert('Failed to save food item: ' + (error.response?.data?.message || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin');
    };

    return (
        <div className="page-container">
            <div className="admin-header">
                <h1>➕ Add Food Item</h1>
                <p>Create a new food item for the cafeteria</p>
                <div className="header-actions">
                    <button className="btn outline-btn" onClick={handleCancel}>
                        ← Back to Dashboard
                    </button>
                    <button
                        onClick={testFormDataPost}
                        className="btn btn-success"
                        style={{ marginLeft: '10px' }}
                    >
                        🧪 Test FormData
                    </button>
                </div>
            </div>

            <div className="food-item-form-container">
                <form onSubmit={handleSubmitFoodItem} className="food-form">
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
                                    value={newFoodItem.name}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    required
                                    disabled={loading}
                                    placeholder="Enter food item name"
                                />
                            </div>

                            <div className="form-group required-field">
                                <label htmlFor="category">Category *</label>
                                <select 
                                    id="category"
                                    name="category" 
                                    value={newFoodItem.category} 
                                    onChange={handleInputChange} 
                                    className="form-control" 
                                    required 
                                    disabled={loading}
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
                                    value={newFoodItem.mealTime} 
                                    onChange={handleInputChange} 
                                    className="form-control" 
                                    required 
                                    disabled={loading}
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
                                        value={newFoodItem.price}
                                        onChange={handleInputChange}
                                        className="form-control"
                                        required
                                        disabled={loading}
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
                                    value={newFoodItem.shortDescription}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    disabled={loading}
                                    placeholder="Brief description (max 100 characters)"
                                    maxLength="100"
                                />
                                <div className="char-count">
                                    {newFoodItem.shortDescription.length}/100
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Full Description</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={newFoodItem.description}
                                    onChange={handleInputChange}
                                    className="form-control"
                                    rows="4"
                                    disabled={loading}
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
                                    onClick={() => setNewFoodItem(prev => ({ ...prev, quantity: Math.max(0, prev.quantity - 1) }))}
                                    disabled={loading}
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    id="quantity"
                                    name="quantity"
                                    min="0"
                                    value={newFoodItem.quantity}
                                    onChange={handleInputChange}
                                    className="form-control quantity-input"
                                    disabled={loading}
                                />
                                <button 
                                    type="button" 
                                    className="quantity-btn" 
                                    onClick={() => setNewFoodItem(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                                    disabled={loading}
                                >
                                    +
                                </button>
                            </div>
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
                                    className={`tag-option ${newFoodItem.dietaryTags.includes(tag) ? 'selected' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={newFoodItem.dietaryTags.includes(tag)}
                                        onChange={() => handleDietaryTagChange(tag)}
                                        disabled={loading}
                                    />
                                    <span>{tag.replace('_', ' ').toUpperCase()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className="form-section image-section">
                        <h3>Food Image *</h3>
                        <div className="image-upload-section">
                            <label className="file-upload-area">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    required
                                    disabled={loading}
                                />
                                <div className="file-upload-label">
                                    📸 Choose Image
                                </div>
                            </label>
                            <p className="file-help-text">
                                Upload a high-quality image of the food item<br />
                                Max file size: 5MB | Supported formats: JPG, PNG, WebP
                            </p>
                            
                            {selectedImagePreview && (
                                <div className="image-preview-container">
                                    <h4>Image Preview:</h4>
                                    <img 
                                        src={selectedImagePreview} 
                                        alt="Food Preview" 
                                        className="image-preview" 
                                    />
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
                                    checked={newFoodItem.featured}
                                    onChange={handleInputChange}
                                    disabled={loading}
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
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner spinner-sm"></span>
                                    Adding Food Item...
                                </>
                            ) : (
                                '➕ Add Food Item'
                            )}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-outline" 
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFoodItem;