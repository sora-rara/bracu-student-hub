import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../api/axios.jsx';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const EditFoodItem = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [foodItem, setFoodItem] = useState(null);

    useEffect(() => {
        const fetchFoodItem = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/cafeteria/admin/food-items/${id}`);
                if (response.data?.success) {
                    const item = response.data.data?.foodItem;
                    setFoodItem(item);
                }
            } catch (error) {
                console.error('Error fetching food item:', error);
                alert('Failed to load food item');
                navigate('/admin');
            } finally {
                setLoading(false);
            }
        };

        fetchFoodItem();
    }, [id, navigate]);

    const getImageUrl = (imageName) => {
        if (!imageName) return null;
        if (imageName.startsWith('http')) return imageName;
        if (imageName.startsWith('/uploads/')) return `${BASE_URL.replace('/api', '')}${imageName}`;
        return `${BASE_URL.replace('/api', '')}/uploads/${imageName}`;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFoodItem(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!foodItem.name.trim()) {
            alert('Please enter food item name');
            return;
        }
        if (!foodItem.price || isNaN(foodItem.price) || parseFloat(foodItem.price) <= 0) {
            alert('Please enter a valid price');
            return;
        }

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

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            const response = await axios.put(`/cafeteria/admin/food-items/${id}`, formData, config);

            if (response.data?.success) {
                alert('✅ Food item updated successfully!');
                navigate('/admin');
            } else {
                alert('❌ Failed: ' + (response.data?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error updating food item:', error);
            alert('Failed to update food item: ' + (error.response?.data?.message || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/admin');
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!foodItem) {
        return <div>Food item not found</div>;
    }

    return (
        <div className="page-container">
            <div className="admin-header">
                <h1>✏️ Edit Food Item</h1>
                <p>Edit "{foodItem.name}"</p>
                <div className="header-actions">
                    <button onClick={handleCancel}>← Back to Dashboard</button>
                </div>
            </div>

            <div className="admin-section">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={foodItem.name}
                            onChange={handleInputChange}
                            required
                            disabled={submitting}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Category *</label>
                            <select name="category" value={foodItem.category} onChange={handleInputChange} required disabled={submitting}>
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
                            <select name="mealTime" value={foodItem.mealTime} onChange={handleInputChange} required disabled={submitting}>
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
                                value={foodItem.price}
                                onChange={handleInputChange}
                                required
                                disabled={submitting}
                            />
                        </div>

                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                name="quantity"
                                value={foodItem.quantity}
                                onChange={handleInputChange}
                                disabled={submitting}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={foodItem.description}
                            onChange={handleInputChange}
                            rows="3"
                            disabled={submitting}
                            placeholder="Detailed description of the food item"
                        />
                    </div>

                    <div className="form-group">
                        <label>Short Description</label>
                        <input
                            type="text"
                            name="shortDescription"
                            value={foodItem.shortDescription}
                            onChange={handleInputChange}
                            disabled={submitting}
                            placeholder="Brief description (max 100 characters)"
                        />
                    </div>

                    <div className="form-group">
                        <label>Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setFoodItem(prev => ({ ...prev, image: file }));
                                }
                            }}
                            disabled={submitting}
                        />
                        {foodItem.image && typeof foodItem.image === 'string' && (
                            <div>
                                <p>Current image:</p>
                                <img src={getImageUrl(foodItem.image)} alt={foodItem.name} className="image-preview" />
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Dietary Tags</label>
                        <div className="tags">
                            {['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_free', 'spicy'].map(tag => (
                                <label key={tag} className="tag-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={Array.isArray(foodItem.dietaryTags) && foodItem.dietaryTags.includes(tag)}
                                        onChange={() => {
                                            const currentTags = Array.isArray(foodItem.dietaryTags) ? [...foodItem.dietaryTags] : [];
                                            if (currentTags.includes(tag)) {
                                                setFoodItem(prev => ({
                                                    ...prev,
                                                    dietaryTags: currentTags.filter(t => t !== tag)
                                                }));
                                            } else {
                                                setFoodItem(prev => ({
                                                    ...prev,
                                                    dietaryTags: [...currentTags, tag]
                                                }));
                                            }
                                        }}
                                        disabled={submitting}
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
                                checked={foodItem.featured}
                                onChange={handleInputChange}
                                disabled={submitting}
                            />
                            <span>Featured Item</span>
                        </label>
                    </div>

                    <div className="form-buttons">
                        <button type="submit" disabled={submitting}>
                            {submitting ? 'Updating...' : 'Update Food Item'}
                        </button>
                        <button type="button" onClick={handleCancel} disabled={submitting}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditFoodItem;