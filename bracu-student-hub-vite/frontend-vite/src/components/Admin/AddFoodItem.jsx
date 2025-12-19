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
                    <button onClick={handleCancel}>← Back to Dashboard</button>
                    <button
                        onClick={testFormDataPost}
                        style={{
                            marginLeft: '10px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        🧪 Test FormData
                    </button>
                </div>
            </div>

            <div className="admin-section">
                <form onSubmit={handleSubmitFoodItem}>
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={newFoodItem.name}
                            onChange={handleInputChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Category *</label>
                            <select name="category" value={newFoodItem.category} onChange={handleInputChange} required disabled={loading}>
                                <option value="main_course">Main Course</option>
                                <option value="appetizer">Appetizer</option>
                                <option value="dessert">Dessert</option>
                                <option value="beverage">Beverage</option>
                                <option value="side_dish">Side Dish</option>
                                <option value="snack">Snack</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Meal Time *</label>
                            <select name="mealTime" value={newFoodItem.mealTime} onChange={handleInputChange} required disabled={loading}>
                                <option value="breakfast">Breakfast</option>
                                <option value="lunch">Lunch</option>
                                <option value="dinner">Dinner</option>
                                <option value="snacks">Snacks</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Price *</label>
                            <input
                                type="number"
                                step="0.01"
                                name="price"
                                value={newFoodItem.price}
                                onChange={handleInputChange}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                name="quantity"
                                value={newFoodItem.quantity}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={newFoodItem.description}
                            onChange={handleInputChange}
                            rows="3"
                            disabled={loading}
                            placeholder="Detailed description of the food item"
                        />
                    </div>

                    <div className="form-group">
                        <label>Short Description</label>
                        <input
                            type="text"
                            name="shortDescription"
                            value={newFoodItem.shortDescription}
                            onChange={handleInputChange}
                            disabled={loading}
                            placeholder="Brief description (max 100 characters)"
                        />
                    </div>

                    <div className="form-group">
                        <label>Image *</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            required
                            disabled={loading}
                        />
                        {selectedImagePreview && <img src={selectedImagePreview} alt="Preview" className="image-preview" />}
                    </div>

                    <div className="form-group">
                        <label>Dietary Tags</label>
                        <div className="tags">
                            {['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'spicy'].map(tag => (
                                <label key={tag} className="tag-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={newFoodItem.dietaryTags.includes(tag)}
                                        onChange={() => handleDietaryTagChange(tag)}
                                        disabled={loading}
                                    />
                                    {tag.replace('_', ' ')}
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="featured"
                                checked={newFoodItem.featured}
                                onChange={handleInputChange}
                                disabled={loading}
                            />
                            <span>Featured Item</span>
                        </label>
                    </div>

                    <div className="form-buttons">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Adding...' : 'Add Food Item'}
                        </button>
                        <button type="button" onClick={handleCancel} disabled={loading}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddFoodItem;