import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios.jsx';

const WeeklyPlanning = () => {
    const navigate = useNavigate();
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMealTime, setSelectedMealTime] = useState('lunch');
    const [selectedFoodItems, setSelectedFoodItems] = useState([]);
    const [weekMenus, setWeekMenus] = useState({});
    const [loading, setLoading] = useState(false);
    const [availableFoodItems, setAvailableFoodItems] = useState([]);
    const [viewingDate, setViewingDate] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Fetch available food items and week menus on component mount
    useEffect(() => {
        fetchAdminFoodItems();
        fetchWeekMenus();
    }, []);

    // FIXED: Fetch menus for the current week using daily API calls
    const fetchWeekMenus = useCallback(async () => {
        console.log('🔄 FETCHING WEEK MENUS...');
        setLoading(true);

        try {
            // Calculate start and end of week
            const startDate = new Date(currentWeek);
            startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6); // End on Saturday
            endDate.setHours(23, 59, 59, 999);

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            console.log(`📅 Fetching menus for week: ${startDateStr} to ${endDateStr}`);

            // Fetch each day individually since we don't have weekly endpoint
            await fetchMenusDaily(startDate, endDate);

        } catch (error) {
            console.error('❌ ERROR FETCHING WEEK MENUS:', error);
            console.error('Error details:', error.response?.data);
            setWeekMenus({});
        } finally {
            setLoading(false);
        }
    }, [currentWeek]);

    // Fetch menus day by day - This is your actual working method
    const fetchMenusDaily = async (startDate, endDate) => {
        const menusByDate = {};
        const promises = [];

        // Create 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];

            promises.push(
                axios.get(`/cafeteria/menu/date/${dateStr}`)
                    .then(res => {
                        console.log(`📥 Response for ${dateStr}:`, res.data);
                        if (res.data.success && res.data.data) {
                            menusByDate[dateStr] = formatMenuItemsForDate(res.data.data);
                        } else {
                            menusByDate[dateStr] = { breakfast: [], lunch: [], dinner: [], snacks: [] };
                        }
                    })
                    .catch(err => {
                        console.warn(`No menu for ${dateStr}:`, err.message);
                        menusByDate[dateStr] = { breakfast: [], lunch: [], dinner: [], snacks: [] };
                    })
            );
        }

        await Promise.all(promises);
        console.log('📋 DAILY MENUS COLLECTED:', menusByDate);
        setWeekMenus(menusByDate);
    };

    // Process the received menu data
    const processWeekMenusData = (apiData) => {
        const formattedMenus = {};

        // For daily API response
        if (apiData.menus && Array.isArray(apiData.menus)) {
            apiData.menus.forEach(menu => {
                const dateStr = menu.date?.split('T')[0] || menu.date;
                if (dateStr) {
                    if (!formattedMenus[dateStr]) {
                        formattedMenus[dateStr] = { breakfast: [], lunch: [], dinner: [], snacks: [] };
                    }
                    if (menu.mealTime && menu.foodItems) {
                        formattedMenus[dateStr][menu.mealTime] = menu.foodItems
                            .filter(fi => fi.item?._id || fi._id)
                            .map(fi => fi.item?._id || fi._id);
                    }
                }
            });
        } else if (Array.isArray(apiData)) {
            // Handle array response
            apiData.forEach(item => {
                const dateStr = item.date?.split('T')[0];
                if (dateStr) {
                    if (!formattedMenus[dateStr]) {
                        formattedMenus[dateStr] = { breakfast: [], lunch: [], dinner: [], snacks: [] };
                    }
                    if (item.mealTime && item.foodItem?._id) {
                        formattedMenus[dateStr][item.mealTime].push(item.foodItem._id);
                    }
                }
            });
        }

        console.log('📋 FORMATTED WEEK MENUS:', formattedMenus);
        setWeekMenus(formattedMenus);
    };

    const formatMenuItemsForDate = (menuData) => {
        const result = { breakfast: [], lunch: [], dinner: [], snacks: [] };

        if (!menuData) return result;

        // Handle array of menu items (from daily fetch)
        if (Array.isArray(menuData)) {
            menuData.forEach(item => {
                if (item.mealTime && result[item.mealTime]) {
                    const foodItem = item.foodItem || item.item || item;
                    if (foodItem?._id) {
                        result[item.mealTime].push(foodItem._id);
                    }
                }
            });
        }
        // Handle menus array structure
        else if (menuData.menus && Array.isArray(menuData.menus)) {
            menuData.menus.forEach(menu => {
                if (menu.mealTime && result[menu.mealTime] && menu.foodItems) {
                    result[menu.mealTime] = menu.foodItems
                        .filter(fi => fi.item?._id || fi._id)
                        .map(fi => fi.item?._id || fi._id);
                }
            });
        }

        return result;
    };

    // Load menu for specific date and meal
    const loadMenuForDateAndMeal = useCallback(async () => {
        if (!selectedDate || !selectedMealTime) return;

        try {
            console.log(`📝 Loading menu for ${selectedDate} - ${selectedMealTime}`);

            // First check if we have cached data
            const cachedItems = getCachedMenuItems(selectedDate, selectedMealTime);
            if (cachedItems.length > 0) {
                setSelectedFoodItems(cachedItems);
                setViewingDate(selectedDate);
                console.log('✅ Using cached items:', cachedItems.map(i => i.name));
                return;
            }

            // Try to fetch fresh data from the date endpoint
            try {
                const response = await axios.get(`/cafeteria/menu/date/${selectedDate}`);
                console.log('📥 Menu API Response:', response.data);

                if (response.data.success && response.data.data) {
                    const menuData = response.data.data;
                    let items = [];

                    // Extract items based on structure
                    if (Array.isArray(menuData)) {
                        // Filter by mealTime and extract food items
                        items = menuData
                            .filter(item => item.mealTime === selectedMealTime)
                            .map(item => item.foodItem || item.item || item)
                            .filter(Boolean);
                    } else if (menuData.menus && Array.isArray(menuData.menus)) {
                        items = menuData.menus
                            .filter(menu => menu.mealTime === selectedMealTime)
                            .flatMap(menu => menu.foodItems || [])
                            .map(fi => fi.item || fi)
                            .filter(Boolean);
                    }

                    console.log(`✅ Loaded ${items.length} items from API for ${selectedMealTime}`);
                    setSelectedFoodItems(items);
                    setViewingDate(selectedDate);

                    // Update cache
                    updateMenuCache(selectedDate, selectedMealTime, items);
                } else {
                    console.log('No items found for this date/meal');
                    setSelectedFoodItems([]);
                    setViewingDate(selectedDate);
                }
            } catch (fetchError) {
                console.log('No API data, using empty selection');
                setSelectedFoodItems([]);
                setViewingDate(selectedDate);
            }
        } catch (error) {
            console.error('❌ Error loading menu:', error);
            setSelectedFoodItems([]);
            setViewingDate(selectedDate);
        }
    }, [selectedDate, selectedMealTime, availableFoodItems]);

    // Helper functions
    const getCachedMenuItems = (dateStr, mealTime) => {
        if (!weekMenus[dateStr] || !weekMenus[dateStr][mealTime]) return [];

        const itemIds = weekMenus[dateStr][mealTime];
        if (!Array.isArray(itemIds)) return [];

        return availableFoodItems.filter(item =>
            itemIds.includes(item._id) ||
            itemIds.includes(item._id?.toString())
        );
    };

    const updateMenuCache = (dateStr, mealTime, items) => {
        const itemIds = items.map(item => item._id || item._id?.toString()).filter(Boolean);
        setWeekMenus(prev => ({
            ...prev,
            [dateStr]: {
                ...prev[dateStr],
                [mealTime]: itemIds
            }
        }));
    };

    // Fetch weekly menus when week changes
    useEffect(() => {
        fetchWeekMenus();
    }, [currentWeek, fetchWeekMenus]);

    // Load menu when date or meal time changes
    useEffect(() => {
        loadMenuForDateAndMeal();
    }, [selectedDate, selectedMealTime, loadMenuForDateAndMeal]);

    // Fetch all food items
    const fetchAdminFoodItems = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/cafeteria/admin/food-items');
            console.log('📦 Food items response:', response.data);

            let items = [];
            if (response.data?.data?.foodItems) {
                items = response.data.data.foodItems;
            } else if (response.data?.foodItems) {
                items = response.data.foodItems;
            } else if (Array.isArray(response.data)) {
                items = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                items = response.data.data;
            }

            console.log(`✅ Loaded ${items.length} available food items`);
            setAvailableFoodItems(items || []);
        } catch (error) {
            console.error('Error fetching food items:', error);
        } finally {
            setLoading(false);
        }
    };

    // FIXED SAVE FUNCTION - Using correct endpoint
    const handleSaveMenu = async () => {
        if (selectedFoodItems.length === 0) {
            alert('Please select at least one food item');
            return;
        }

        if (!selectedDate || !selectedMealTime) {
            alert('Please select date and meal time');
            return;
        }

        setLoading(true);
        setSaveSuccess(false);
        try {
            const foodItemIds = selectedFoodItems.map(item => item._id);

            console.log('💾 SAVING MENU:', {
                date: selectedDate,
                mealTime: selectedMealTime,
                foodItemIds: foodItemIds,
                foodItems: selectedFoodItems.map(item => item.name)
            });

            // Save to backend using correct endpoint
            const response = await axios.post('/cafeteria/admin/menu', {
                date: selectedDate,
                mealTime: selectedMealTime,
                foodItemIds: foodItemIds
            });

            console.log('✅ SAVE RESPONSE:', response.data);

            if (response.data?.success) {
                // CRITICAL: Update local state IMMEDIATELY
                setWeekMenus(prev => {
                    const newState = {
                        ...prev,
                        [selectedDate]: {
                            ...prev[selectedDate],
                            [selectedMealTime]: foodItemIds
                        }
                    };
                    console.log('🔄 UPDATED WEEK MENUS STATE:', newState);
                    return newState;
                });

                setViewingDate(selectedDate);
                setSaveSuccess(true);

                // Show success message
                alert(`✅ Menu saved successfully! ${selectedFoodItems.length} items added to ${selectedDate} ${selectedMealTime}`);

                // Refresh overview after a short delay
                setTimeout(() => {
                    fetchWeekMenus();
                }, 500);

            } else {
                alert('❌ Failed to save menu: ' + (response.data?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('❌ ERROR SAVING MENU:', error);
            console.error('Error response:', error.response?.data);
            alert('Error saving menu. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    // FIXED: Database check function - removed weekly endpoint check
    const checkDatabaseMenus = async () => {
        try {
            console.log('🔍 CHECKING DATABASE...');

            // Check today's menu as a test
            const today = new Date().toISOString().split('T')[0];
            const response = await axios.get(`/cafeteria/menu/date/${today}`);

            console.log('📊 DATABASE RESPONSE:', response.data);

            if (response.data.success) {
                let message = '✅ Database connection successful!\n\n';

                if (response.data.data) {
                    if (Array.isArray(response.data.data)) {
                        message += `Today's menu has ${response.data.data.length} menu items\n`;
                        response.data.data.forEach(item => {
                            message += `- ${item.mealTime}: ${item.foodItem?.name || 'No name'}\n`;
                        });
                    } else if (response.data.data.menus) {
                        message += `Today's menu has ${response.data.data.menus.length} meals\n`;
                        response.data.data.menus.forEach(menu => {
                            message += `- ${menu.mealTime}: ${menu.foodItems?.length || 0} items\n`;
                        });
                    }
                } else {
                    message += 'No menu found for today\n';
                }

                alert(message);
            } else {
                alert('⚠️ Database query returned success: false');
            }
        } catch (error) {
            console.error('Database check error:', error);
            alert(`❌ Database check failed: ${error.message || 'Unknown error'}\n\nEndpoint: /cafeteria/menu/date/{date}`);
        }
    };

    const forceRefreshOverview = async () => {
        setLoading(true);
        try {
            await fetchWeekMenus();
            alert('🔄 Overview refreshed!');
        } catch (error) {
            console.error('Refresh error:', error);
            alert('Error refreshing');
        } finally {
            setLoading(false);
        }
    };

    const handleAddFoodItem = (foodItemId) => {
        const item = availableFoodItems.find(f => f._id === foodItemId);
        if (item && !selectedFoodItems.some(f => f._id === foodItemId)) {
            setSelectedFoodItems([...selectedFoodItems, item]);
        }
    };

    const handleRemoveFoodItem = (itemId) => {
        setSelectedFoodItems(selectedFoodItems.filter(item => item._id !== itemId));
    };

    // Get meal items count for overview
    const getMealItemsCount = (dateStr, mealTime) => {
        if (!weekMenus[dateStr] || !weekMenus[dateStr][mealTime]) {
            return 0;
        }

        const items = weekMenus[dateStr][mealTime];
        return Array.isArray(items) ? items.length : 0;
    };

    // Get actual meal items for display
    const getMealItems = (dateStr, mealTime) => {
        if (!weekMenus[dateStr] || !weekMenus[dateStr][mealTime]) {
            return [];
        }

        const itemIds = weekMenus[dateStr][mealTime];
        if (!Array.isArray(itemIds) || itemIds.length === 0) return [];

        return availableFoodItems.filter(item =>
            itemIds.includes(item._id) ||
            itemIds.includes(item._id?.toString())
        );
    };

    // Utility functions
    const getImageUrl = (imageName) => {
        if (!imageName) return 'https://via.placeholder.com/50x50/FF6B6B/FFFFFF?text=No+Img';
        if (typeof imageName !== 'string') return 'https://via.placeholder.com/50x50/FF6B6B/FFFFFF?text=No+Img';
        if (imageName.startsWith('http')) return imageName;
        if (imageName.startsWith('/uploads/')) return `${window.location.origin}${imageName}`;
        return `${window.location.origin}/uploads/${imageName}`;
    };

    // Generate week days
    const getWeekDays = () => {
        const days = [];
        const current = new Date(currentWeek);
        current.setDate(current.getDate() - current.getDay()); // Start from Sunday

        for (let i = 0; i < 7; i++) {
            const day = new Date(current);
            day.setDate(current.getDate() + i);
            days.push(day);
        }

        return days;
    };

    const weekDays = getWeekDays();

    // Navigation functions
    const handleCancel = () => {
        navigate('/admin');
    };

    const handlePreviousWeek = () => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() - 7);
        setCurrentWeek(newWeek);
    };

    const handleNextWeek = () => {
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() + 7);
        setCurrentWeek(newWeek);
    };

    const handleViewDay = (dateStr) => {
        console.log(`👁️ Viewing day: ${dateStr}`);
        setSelectedDate(dateStr);
        setSelectedMealTime('lunch');
        setViewingDate(dateStr);
    };

    const formatWeekDisplay = () => {
        if (weekDays.length === 0) return '';

        const startDate = weekDays[0];
        const endDate = weekDays[6];

        const startFormatted = startDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });

        const endFormatted = endDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `Week of ${startFormatted} - ${endFormatted}`;
    };

    // Calculate statistics
    const calculateStats = () => {
        const daysPlanned = Object.keys(weekMenus).filter(date => {
            const dayData = weekMenus[date];
            if (!dayData) return false;
            // Check if any meal has items
            return ['breakfast', 'lunch', 'dinner', 'snacks'].some(meal =>
                Array.isArray(dayData[meal]) && dayData[meal].length > 0
            );
        }).length;

        const totalItemsPlanned = Object.values(weekMenus).reduce((total, day) => {
            if (!day) return total;
            let dayTotal = 0;
            ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(meal => {
                if (Array.isArray(day[meal])) {
                    dayTotal += day[meal].length;
                }
            });
            return total + dayTotal;
        }, 0);

        return { daysPlanned, totalItemsPlanned };
    };

    const stats = calculateStats();

    return (
        <div className="weekly-planning-container">
            <div className="planning-header">
                <h2>📋 Weekly Menu Planning</h2>
                <div className="header-actions">
                    <button onClick={handleCancel} className="back-btn">
                        ← Back to Dashboard
                    </button>
                </div>
                <div className="week-navigation">
                    <button onClick={handlePreviousWeek} className="nav-btn" disabled={loading}>
                        ← Previous Week
                    </button>
                    <span className="week-display">{formatWeekDisplay()}</span>
                    <button onClick={handleNextWeek} className="nav-btn" disabled={loading}>
                        Next Week →
                    </button>
                </div>
            </div>

            {/* Debug Controls - UPDATED */}
            <div className="debug-controls" style={{
                padding: '15px',
                backgroundColor: '#f0f7ff',
                border: '2px dashed #4CAF50',
                borderRadius: '8px',
                margin: '20px 0'
            }}>
                <h4 style={{ marginTop: 0, color: '#2196F3' }}>🔧 Debug Tools</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                        onClick={checkDatabaseMenus}
                        className="debug-btn"
                        style={{ backgroundColor: '#2196F50', color: 'white', padding: '8px 16px' }}
                        disabled={loading}
                    >
                        🔍 Test Database
                    </button>
                    <button
                        onClick={forceRefreshOverview}
                        className="refresh-btn"
                        style={{ backgroundColor: '#FF9800', color: 'white', padding: '8px 16px' }}
                        disabled={loading}
                    >
                        🔄 Refresh Overview
                    </button>
                    <div style={{ marginLeft: 'auto', color: '#666' }}>
                        <strong>State:</strong> {loading ? '⏳ Loading...' : '✅ Ready'}
                        {saveSuccess && <span style={{ color: '#4CAF50', marginLeft: '10px' }}>✓ Saved!</span>}
                    </div>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
                    <strong>Current Data:</strong> {Object.keys(weekMenus).length} days loaded | {availableFoodItems.length} food items available
                    <br />
                    <strong>API:</strong> Using /cafeteria/menu/date/ and /cafeteria/admin/menu
                </div>
            </div>

            {/* Planning Controls */}
            <div className="planning-controls">
                <div className="controls-row">
                    <div className="form-group">
                        <label><strong>Date</strong></label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="date-input"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label><strong>Meal Time</strong></label>
                        <select
                            value={selectedMealTime}
                            onChange={(e) => setSelectedMealTime(e.target.value)}
                            className="meal-select"
                            disabled={loading}
                        >
                            <option value="breakfast">Breakfast</option>
                            <option value="lunch">Lunch</option>
                            <option value="dinner">Dinner</option>
                            <option value="snacks">Snacks</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label><strong>Add Food Item</strong></label>
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleAddFoodItem(e.target.value);
                                    e.target.value = '';
                                }
                            }}
                            className="food-select"
                            disabled={loading}
                        >
                            <option value="">Select food item...</option>
                            {availableFoodItems
                                .filter(item => !selectedFoodItems.some(selected => selected._id === item._id))
                                .map(item => (
                                    <option key={item._id} value={item._id}>
                                        {item.name} (৳{item.price?.toFixed(2) || '0.00'})
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                </div>
            </div>

            {/* Selected Items Section */}
            <div className="selected-items-section">
                <h3>
                    📝 {viewingDate === selectedDate ?
                        `Menu for ${selectedDate} - ${selectedMealTime.charAt(0).toUpperCase() + selectedMealTime.slice(1)}` :
                        `Planning for ${selectedDate} - ${selectedMealTime}`
                    }
                    {selectedFoodItems.length > 0 &&
                        <span style={{ color: '#4CAF50', marginLeft: '10px' }}>
                            ({selectedFoodItems.length} items selected)
                        </span>
                    }
                </h3>

                {selectedFoodItems.length > 0 ? (
                    <>
                        <div className="selected-items-grid">
                            {selectedFoodItems.map(item => (
                                <div key={item._id} className="selected-item-card" style={{
                                    border: '2px solid #4CAF50',
                                    backgroundColor: '#f0f7ff'
                                }}>
                                    <img
                                        src={getImageUrl(item.image)}
                                        alt={item.name}
                                        className="item-thumb"
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/50x50/FF6B6B/FFFFFF?text=No+Img';
                                        }}
                                    />
                                    <div className="item-details">
                                        <h4 style={{ color: '#2196F3' }}>{item.name}</h4>
                                        <p>৳{item.price?.toFixed(2) || '0.00'} • {item.category || 'Uncategorized'}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveFoodItem(item._id)}
                                        className="remove-btn"
                                        title="Remove item"
                                        disabled={loading}
                                        style={{ backgroundColor: '#FF6B6B', color: 'white' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="action-buttons" style={{ marginTop: '20px' }}>
                            <button
                                onClick={handleSaveMenu}
                                disabled={loading}
                                className="save-btn"
                                style={{
                                    backgroundColor: '#4CAF50',
                                    color: 'white',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {loading ? '⏳ Saving...' : `💾 SAVE ${selectedMealTime.toUpperCase()} MENU`}
                            </button>
                            <button
                                onClick={() => setSelectedFoodItems([])}
                                className="clear-btn"
                                disabled={loading}
                                style={{
                                    marginLeft: '10px',
                                    padding: '12px 24px',
                                    backgroundColor: '#666',
                                    color: 'white'
                                }}
                            >
                                Clear Selection
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="no-items-message" style={{
                        padding: '30px',
                        textAlign: 'center',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px'
                    }}>
                        <p style={{ color: '#666', fontSize: '16px' }}>
                            No items selected. Select food items from the dropdown above to create a menu.
                        </p>
                    </div>
                )}
            </div>

            {/* Weekly Calendar View */}
            <div className="weekly-calendar" style={{ marginTop: '30px' }}>
                <h3 style={{ color: '#2196F3' }}>
                    📅 Weekly Overview
                    <span style={{ fontSize: '14px', marginLeft: '10px', color: '#666' }}>
                        ({stats.daysPlanned} days planned with {stats.totalItemsPlanned} total items)
                    </span>
                </h3>

                <div className="calendar-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '15px',
                    marginTop: '15px'
                }}>
                    {weekDays.map((day, index) => {
                        const dateStr = day.toISOString().split('T')[0];
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        const isSelected = dateStr === selectedDate;
                        const dayMenus = weekMenus[dateStr] || { breakfast: [], lunch: [], dinner: [], snacks: [] };

                        // Calculate total items for this day
                        const dayTotal = ['breakfast', 'lunch', 'dinner', 'snacks'].reduce((sum, meal) =>
                            sum + getMealItemsCount(dateStr, meal), 0
                        );

                        return (
                            <div key={index} className={`day-card ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                                style={{
                                    border: isToday ? '3px solid #FF9800' : isSelected ? '3px solid #2196F3' : '1px solid #ddd',
                                    backgroundColor: dayTotal > 0 ? '#f0f7ff' : 'white',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                }}>
                                <div className="day-header" style={{
                                    backgroundColor: isToday ? '#FF9800' : isSelected ? '#2196F3' : '#f5f5f5',
                                    color: isToday || isSelected ? 'white' : '#333',
                                    padding: '10px',
                                    textAlign: 'center'
                                }}>
                                    <div className="day-name" style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                        {day.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                                    </div>
                                    <div className="day-date" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                                        {day.getDate()}
                                    </div>
                                    <div className="month-year" style={{ fontSize: '12px', opacity: 0.8 }}>
                                        {day.toLocaleDateString('en-US', { month: 'short' })}
                                    </div>
                                </div>

                                <div className="day-meals" style={{ padding: '10px' }}>
                                    {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => {
                                        const itemCount = getMealItemsCount(dateStr, meal);
                                        const items = getMealItems(dateStr, meal);

                                        return (
                                            <div key={meal} className="meal-slot" style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '5px',
                                                padding: '5px',
                                                backgroundColor: itemCount > 0 ? '#E8F5E9' : '#f5f5f5',
                                                borderRadius: '4px',
                                                position: 'relative'
                                            }}
                                                title={items.length > 0 ?
                                                    `${items.length} items in ${meal}: ${items.map(i => i.name).join(', ')}` :
                                                    `No items in ${meal}`
                                                }>
                                                <span className="meal-label" style={{
                                                    fontWeight: 'bold',
                                                    fontSize: '11px'
                                                }}>
                                                    {meal.charAt(0).toUpperCase()}
                                                </span>
                                                <span className="item-count" style={{
                                                    color: itemCount > 0 ? '#4CAF50' : '#999',
                                                    fontWeight: 'bold',
                                                    fontSize: '12px',
                                                    backgroundColor: itemCount > 0 ? 'white' : 'transparent',
                                                    padding: '1px 6px',
                                                    borderRadius: '8px',
                                                    border: itemCount > 0 ? '1px solid #4CAF50' : '1px solid #ddd',
                                                    minWidth: '20px',
                                                    textAlign: 'center'
                                                }}>
                                                    {itemCount}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="day-actions" style={{
                                    padding: '8px',
                                    borderTop: '1px solid #eee',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#f9f9f9'
                                }}>
                                    <button
                                        className="view-day-btn"
                                        onClick={() => handleViewDay(dateStr)}
                                        disabled={loading}
                                        style={{
                                            backgroundColor: '#2196F3',
                                            color: 'white',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '11px',
                                            cursor: 'pointer',
                                            border: 'none'
                                        }}
                                    >
                                        View/Edit
                                    </button>
                                    <div className="day-total" style={{
                                        fontWeight: 'bold',
                                        color: dayTotal > 0 ? '#4CAF50' : '#666',
                                        fontSize: '12px'
                                    }}>
                                        Total: {dayTotal}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Statistics Section */}
            <div className="planning-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '20px',
                marginTop: '30px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '10px'
            }}>
                <div className="stat-card" style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div className="stat-number" style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: '#2196F3'
                    }}>
                        {availableFoodItems.length}
                    </div>
                    <div className="stat-label" style={{
                        marginTop: '8px',
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        Available Items
                    </div>
                </div>

                <div className="stat-card" style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div className="stat-number" style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: stats.daysPlanned > 0 ? '#4CAF50' : '#FF9800'
                    }}>
                        {stats.daysPlanned}
                    </div>
                    <div className="stat-label" style={{
                        marginTop: '8px',
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        Days Planned
                    </div>
                </div>

                <div className="stat-card" style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div className="stat-number" style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: stats.totalItemsPlanned > 0 ? '#4CAF50' : '#FF9800'
                    }}>
                        {stats.totalItemsPlanned}
                    </div>
                    <div className="stat-label" style={{
                        marginTop: '8px',
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        Total Items Planned
                    </div>
                </div>

                <div className="stat-card" style={{
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                    <div className="stat-number" style={{
                        fontSize: '32px',
                        fontWeight: 'bold',
                        color: selectedFoodItems.length > 0 ? '#4CAF50' : '#FF9800'
                    }}>
                        {selectedFoodItems.length}
                    </div>
                    <div className="stat-label" style={{
                        marginTop: '8px',
                        color: '#666',
                        fontSize: '14px'
                    }}>
                        Currently Selected
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeeklyPlanning;