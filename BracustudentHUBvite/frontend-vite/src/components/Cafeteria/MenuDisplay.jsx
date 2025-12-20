import React, { useState, useEffect } from 'react';
import axios from '../../api/axios.jsx';
import { format, parseISO, isToday } from 'date-fns';
import FoodItemCard from './FoodItemCard.jsx';

const MenuDisplay = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState('lunch');

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');

        const response = await axios.get(`/cafeteria/menu/date/${formattedDate}`);
        console.log('Menu response:', response.data);

        if (response.data.success) {
          setMenu(response.data.data);
          setError(null);
        } else {
          setMenu(null);
          setError('No menu available for this date');
        }
      } catch (err) {
        console.error('Error fetching menu:', err.response?.data || err.message);

        if (err.response?.status === 404) {
          setError('Menu endpoint not found. Check backend routes.');
        } else if (err.message === 'Network Error') {
          setError("Cannot connect to backend server. Make sure it's running on port 5000.");
        } else {
          setError(err.response?.data?.message || 'Failed to fetch menu. Please try again.');
        }

        setMenu(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [selectedDate]);


  const handleDateChange = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const getMealItems = (mealType) => {
    if (!menu || !menu.menus) return [];

    const mealMenu = menu.menus.find(m => m.mealTime === mealType);
    if (!mealMenu || !mealMenu.foodItems) return [];

    return mealMenu.foodItems.map(item => item.item).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="menu-display-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-display-container">
      {/* Date Navigation */}
      <div className="date-navigation">
        <button
          onClick={() => handleDateChange(-1)}
          className="nav-btn"
        >
          ← Previous Day
        </button>

        <div className="date-display">
          <h2>
            {format(selectedDate, 'EEEE, MMMM dd, yyyy')}
            {isToday(selectedDate) && <span className="today-badge">TODAY</span>}
          </h2>
        </div>

        <button
          onClick={() => handleDateChange(1)}
          className="nav-btn"
        >
          Next Day →
        </button>
      </div>

      {/* Meal Type Selector */}
      <div className="meal-type-selector">
        {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (
          <button
            key={meal}
            className={`meal-tab ${selectedMealType === meal ? 'active' : ''}`}
            onClick={() => setSelectedMealType(meal)}
          >
            {meal.charAt(0).toUpperCase() + meal.slice(1)}
          </button>
        ))}
      </div>

      {/* Menu Content */}
      <div className="menu-content">
        {error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => fetchMenuByDate(selectedDate)}>
              Try Again
            </button>
          </div>
        ) : !menu ? (
          <div className="no-menu">
            <h3>No menu available for this date</h3>
            <p>Check back later or try a different date</p>
          </div>
        ) : (
          <>
            <div className="meal-section">
              <h3 className="meal-header">
                {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} Menu
              </h3>

              <div className="food-items-grid">
                {getMealItems(selectedMealType).length > 0 ? (
                  getMealItems(selectedMealType).map((item) => (
                    <FoodItemCard key={item._id || item.name} item={item} />
                  ))
                ) : (
                  <div className="no-items">
                    <p>No items available for {selectedMealType}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MenuDisplay;