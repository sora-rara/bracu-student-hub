import React, { useState, useEffect } from 'react';
import axios from '../api/axios.jsx';

const AdminPanel = ({ refreshData }) => {
    const [foodItems, setFoodItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'main_course',
        mealTime: 'lunch',
        dietaryTags: [],
        featured: false,
        image: null
    });

    useEffect(() => {
        fetchFoodItems();
    }, []);

    const fetchFoodItems = async () => {
        try {
            const response = await axios.get('/admin/food-items');
            setFoodItems(response.data.data?.foodItems || []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching food items:', error);
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleFileChange = (e) => {
        setFormData({
            ...formData,
            image: e.target.files[0]
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'dietaryTags') {
                // Handle array
                formData[key].forEach(tag => data.append('dietaryTags', tag));
            } else if (key === 'image' && formData[key]) {
                data.append('image', formData[key]);
            } else {
                data.append(key, formData[key]);
            }
        });

        try {
            if (editingItem) {
                // Update
                await axios.put(`/admin/food-items/${editingItem._id}`, data);
                alert('Food item updated successfully!');
            } else {
                // Create
                await axios.post('/admin/food-items', data);
                alert('Food item created successfully!');
            }

            resetForm();
            fetchFoodItems();
            refreshData();
        } catch (error) {
            alert('Error saving food item');
            console.error(error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            category: 'main_course',
            mealTime: 'lunch',
            dietaryTags: [],
            featured: false,
            image: null
        });
        setEditingItem(null);
        setShowForm(false);
    };

    const handleEdit = (item) => {
        setFormData({
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            mealTime: item.mealTime,
            dietaryTags: item.dietaryTags || [],
            featured: item.featured,
            image: null
        });
        setEditingItem(item);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await axios.delete(`/admin/food-items/${id}`);
                alert('Food item deleted successfully!');
                fetchFoodItems();
                refreshData();
            } catch (error) {
                alert('Error deleting food item');
            }
        }
    };

    const toggleFeatured = async (id, currentStatus) => {
        try {
            await axios.patch(`/admin/food-items/${id}/featured`, {
                featured: !currentStatus
            });
            fetchFoodItems();
            refreshData();
        } catch (error) {
            console.error('Error toggling featured:', error);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h2>Admin Panel - Food Items Management</h2>
                <button
                    className="btn-add-item"
                    onClick={() => setShowForm(true)}
                >
                    + Add New Food Item
                </button>
            </div>

            {showForm && (
                <div className="admin-form-container">
                    <h3>{editingItem ? 'Edit Food Item' : 'Add New Food Item'}</h3>
                    <form onSubmit={handleSubmit} encType="multipart/form-data">
                        <div className="form-row">
                            <div className="form-group">
                                <label>Food Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Price *</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Category *</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    required
                                >
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
                                <select
                                    name="mealTime"
                                    value={formData.mealTime}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="breakfast">Breakfast</option>
                                    <option value="lunch">Lunch</option>
                                    <option value="dinner">Dinner</option>
                                    <option value="snacks">Snacks</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="3"
                            />
                        </div>

                        <div className="form-group">
                            <label>Food Image *</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                required={!editingItem}
                            />
                            {editingItem && formData.image && (
                                <p>New image selected: {formData.image.name}</p>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Featured</label>
                            <input
                                type="checkbox"
                                name="featured"
                                checked={formData.featured}
                                onChange={handleInputChange}
                            />
                            <span className="checkbox-label">Mark as featured</span>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-save">
                                {editingItem ? 'Update Item' : 'Save Item'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn-cancel">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="food-items-table">
                <h3>All Food Items ({foodItems.length})</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Category</th>
                                <th>Meal Time</th>
                                <th>Featured</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {foodItems.map(item => (
                                <tr key={item._id}>
                                    <td>
                                        <img
                                            src={`http://localhost:5000${item.image}`}
                                            alt={item.name}
                                            className="item-thumbnail"
                                            onError={(e) => {
                                                e.target.src = 'https://via.placeholder.com/50x50?text=No+Image';
                                            }}
                                        />
                                    </td>
                                    <td>{item.name}</td>
                                    <td>৳{item.price?.toFixed(2)}</td>
                                    <td>{item.category}</td>
                                    <td>{item.mealTime}</td>
                                    <td>
                                        <button
                                            className={`btn-featured ${item.featured ? 'active' : ''}`}
                                            onClick={() => toggleFeatured(item._id, item.featured)}
                                        >
                                            {item.featured ? '⭐ Featured' : '☆'}
                                        </button>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-edit"
                                            onClick={() => handleEdit(item)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDelete(item._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;