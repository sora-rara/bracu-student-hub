const express = require('express');
const router = express.Router();
const FooditemController = require('../controllers/FooditemController');
const { upload } = require('../middleware/upload');
const { requireAdmin, requireAuth } = require('../middleware/adminMiddleware'); // ADD THIS LINE
const FoodItem = require('../models/Fooditem');
const Menu = require('../models/Menu');
const Review = require('../models/Review');

// ====================
// HEALTH CHECK
// ====================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Cafeteria API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      public: {
        'GET /menu/today': "Today's menu",
        'GET /menu/date/:date': "Menu by specific date",
        'GET /featured': "Featured items",
        'GET /menu/weekly-calendar': "Weekly calendar",
        'POST /review': "Submit review",
        'GET /stats': "Statistics",
        'GET /food-items/active': "Active food items",
        'GET /reviews/all': "All reviews"
      },
      admin: {
        'GET /admin/food-items': "All food items",
        'POST /admin/food-items': "Create food item",
        'PUT /admin/food-items/:id': "Update food item",
        'DELETE /admin/food-items/:id': "Delete food item",
        'POST /admin/menu': "Add menu for date",
        'GET /admin/menus/future': "Future menus"
      }
    }
  });
});

// ====================
// PUBLIC ROUTES
// ====================

// Today's menu
router.get('/menu/today', FooditemController.getTodaysMenu);

// Menu by specific date
router.get('/menu/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const menuDate = new Date(date);

    if (isNaN(menuDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    menuDate.setHours(0, 0, 0, 0);

    const nextDay = new Date(menuDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const menus = await Menu.find({
      date: {
        $gte: menuDate,
        $lt: nextDay
      },
      status: 'published'
    })
      .populate({
        path: 'foodItems.item',
        model: 'FoodItem',
        select: 'name price category mealTime image dietaryTags averageRating totalReviews description shortDescription featured status'
      })
      .sort({ mealTime: 1 });

    // Increment views
    await Promise.all(menus.map(menu => {
      menu.views = (menu.views || 0) + 1;
      return menu.save();
    }));

    res.json({
      success: true,
      data: {
        date: menuDate,
        menus,
        totalItems: menus.reduce((sum, menu) => sum + (menu.foodItems?.length || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching menu by date:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu',
      error: error.message
    });
  }
});

// Featured items
router.get('/featured', FooditemController.getFeaturedItems);

// Weekly calendar
router.get('/menu/weekly-calendar', FooditemController.getWeeklyCalendar);

// Get active food items for reviews
router.get('/food-items/active', async (req, res) => {
  try {
    const foodItems = await FoodItem.find({
      status: 'active'
    })
      .select('name price category mealTime image dietaryTags averageRating')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: { foodItems }
    });
  } catch (error) {
    console.error('Error fetching active food items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food items'
    });
  }
});

// Submit review
router.post('/review', async (req, res) => {
  try {
    const { foodItemId, rating, comment, studentName, anonymous } = req.body;

    console.log('📝 Review submission received:', {
      foodItemId,
      rating,
      comment,
      studentName,
      anonymous
    });

    // Validate required fields
    if (!foodItemId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Food item ID, rating, and comment are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Check if food item exists
    const foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Create review with consistent field names
    const review = new Review({
      foodItem: foodItemId,  // This matches the Review model
      studentName: anonymous ? 'Anonymous' : (studentName || 'Anonymous'),
      userEmail: '',  // Optional, can be added later
      anonymous: anonymous || false,
      rating: parseInt(rating),
      comment: comment.trim(),
      status: 'approved'
    });

    const savedReview = await review.save();
    console.log('✅ Review saved successfully:', savedReview._id);

    // Populate for response
    await savedReview.populate('foodItem', 'name price image');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      data: {
        review: savedReview,
        foodItemName: savedReview.foodItem.name
      }
    });
  } catch (error) {
    console.error('❌ Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: error.message
    });
  }
});

// Get all reviews
router.get('/reviews/all', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      Review.find({ status: 'approved' })
        .populate('foodItem', 'name price image category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Review.countDocuments({ status: 'approved' })
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalReviews: total
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

// Get reviews for specific food item
router.get('/food/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;

    const reviews = await Review.find({
      foodItem: id,
      status: 'approved'
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      data: { reviews }
    });
  } catch (error) {
    console.error('Error fetching food reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalFoodItems, totalReviews, featuredItems, todaysMenus] = await Promise.all([
      FoodItem.countDocuments({ status: 'active' }),
      Review.countDocuments({ status: 'approved' }),
      FoodItem.countDocuments({ featured: true, status: 'active' }),
      Menu.find({
        date: { $gte: today },
        status: 'published'
      })
    ]);

    const todaysMenuItems = todaysMenus.reduce((sum, menu) => sum + (menu.foodItems?.length || 0), 0);

    res.json({
      success: true,
      data: {
        totalFoodItems,
        totalReviews,
        featuredItems,
        todaysMenuItems
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// ====================
// ADMIN ROUTES
// ====================

// Get all food items (admin) - ADD requireAdmin MIDDLEWARE
router.get('/admin/food-items', requireAdmin, FooditemController.getAllFoodItems);

// Get single food item - ADD requireAdmin MIDDLEWARE
router.get('/admin/food-items/:id', requireAdmin, FooditemController.getFoodItemById);

// Create food item (with image upload) - ADD requireAdmin MIDDLEWARE
router.post('/admin/food-items', requireAdmin, upload.single('image'), FooditemController.createFoodItem);

// Update food item - ADD requireAdmin MIDDLEWARE
router.put('/admin/food-items/:id', requireAdmin, upload.single('image'), FooditemController.updateFoodItem);

// Delete food item - ADD requireAdmin MIDDLEWARE
router.delete('/admin/food-items/:id', requireAdmin, FooditemController.deleteFoodItem);

// Toggle featured status - ADD requireAdmin MIDDLEWARE
router.patch('/admin/food-items/:id/featured', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    if (featured === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Featured status is required'
      });
    }

    const foodItem = await FoodItem.findByIdAndUpdate(
      id,
      {
        featured: featured === true || featured === 'true',
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.json({
      success: true,
      message: `Food item featured status updated to ${foodItem.featured}`,
      data: { foodItem }
    });
  } catch (error) {
    console.error('Error updating featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating featured status',
      error: error.message
    });
  }
});

// Toggle status - ADD requireAdmin MIDDLEWARE
router.patch('/admin/food-items/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const foodItem = await FoodItem.findByIdAndUpdate(
      id,
      {
        status,
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.json({
      success: true,
      message: `Food item status updated to ${status}`,
      data: { foodItem }
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
});

// Add menu for specific date (WEEKLY PLANNING) - ADD requireAdmin MIDDLEWARE
router.post('/admin/menu', requireAdmin, async (req, res) => {
  try {
    const { date, mealTime, foodItemIds } = req.body;

    console.log('Adding menu:', { date, mealTime, foodItemIds });

    // Validate required fields
    if (!date || !mealTime) {
      return res.status(400).json({
        success: false,
        message: 'Date and mealTime are required'
      });
    }

    const menuDate = new Date(date);
    if (isNaN(menuDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }
    menuDate.setHours(0, 0, 0, 0);

    // Validate mealTime
    const validMealTimes = ['breakfast', 'lunch', 'dinner', 'snacks'];
    if (!validMealTimes.includes(mealTime)) {
      return res.status(400).json({
        success: false,
        message: `Invalid mealTime. Must be one of: ${validMealTimes.join(', ')}`
      });
    }

    // Prepare food items array
    const menuFoodItems = [];
    if (foodItemIds && Array.isArray(foodItemIds) && foodItemIds.length > 0) {
      // Check if food items exist
      const foodItems = await FoodItem.find({
        _id: { $in: foodItemIds },
        status: 'active'
      });

      if (foodItems.length !== foodItemIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more food items not found or inactive'
        });
      }

      menuFoodItems.push(...foodItemIds.map(itemId => ({
        item: itemId,
        available: true
      })));
    }

    // Find existing menu or create new
    let menu = await Menu.findOne({
      date: menuDate,
      mealTime
    });

    if (menu) {
      // Update existing menu
      menu.foodItems = menuFoodItems;
      menu.status = 'published';
      menu.updatedAt = Date.now();
    } else {
      // Create new menu
      menu = new Menu({
        date: menuDate,
        mealTime,
        foodItems: menuFoodItems,
        status: 'published'
      });
    }

    await menu.save();

    // Populate for response
    await menu.populate({
      path: 'foodItems.item',
      select: 'name price image category'
    });

    res.json({
      success: true,
      message: 'Menu saved successfully',
      data: { menu }
    });
  } catch (error) {
    console.error('Error saving menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving menu',
      error: error.message
    });
  }
});

// Get future menus (for admin planning) - ADD requireAdmin MIDDLEWARE
router.get('/admin/menus/future', requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { startDate, endDate } = req.query;

    let query = { date: { $gte: today } };

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      query.date = { $gte: start, $lte: end };
    }

    const futureMenus = await Menu.find(query)
      .populate({
        path: 'foodItems.item',
        select: 'name price category image'
      })
      .sort({ date: 1, mealTime: 1 })
      .limit(100);

    res.json({
      success: true,
      data: {
        menus: futureMenus,
        count: futureMenus.length
      }
    });
  } catch (error) {
    console.error('Error fetching future menus:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching future menus',
      error: error.message
    });
  }
});

// Get available dates for planning - ADD requireAdmin MIDDLEWARE
router.get('/admin/menu/dates', requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const menus = await Menu.find({
      date: { $gte: today, $lte: nextMonth }
    })
      .select('date mealTime')
      .sort({ date: 1 });

    // Group by date
    const dates = {};
    menus.forEach(menu => {
      const dateStr = menu.date.toISOString().split('T')[0];
      if (!dates[dateStr]) {
        dates[dateStr] = [];
      }
      dates[dateStr].push(menu.mealTime);
    });

    res.json({
      success: true,
      data: { dates }
    });
  } catch (error) {
    console.error('Error fetching menu dates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu dates'
    });
  }
});

// ====================
// TEST ENDPOINTS
// ====================

// Test admin authentication - NEW TEST ROUTE
router.get('/admin/test-auth', requireAdmin, (req, res) => {
  console.log('✅ /api/cafeteria/admin/test-auth - Admin access verified');

  res.json({
    success: true,
    message: 'Cafeteria admin authentication successful',
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role
    },
    timestamp: new Date().toISOString()
  });
});

// Test file upload - ADD requireAdmin MIDDLEWARE
router.post('/admin/test-upload', requireAdmin, upload.single('image'), (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Upload test successful',
      file: req.file ? {
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype
      } : null,
      body: req.body,
      user: req.user.email
    });
  } catch (error) {
    console.error('Test upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload test failed',
      error: error.message
    });
  }
});

// Test formdata endpoint - NEW ROUTE
router.post('/admin/test-formdata', requireAdmin, upload.single('image'), (req, res) => {
  console.log('✅ Test formdata route called by admin:', req.user.email);
  console.log('📦 Form data fields:', req.body);
  console.log('📁 File uploaded:', req.file);

  res.json({
    success: true,
    message: "Form data received successfully",
    user: req.user.email,
    body: req.body,
    file: req.file ? {
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype
    } : null
  });
});

// Test connection
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
});

// Add this route to create a test menu - ADD requireAdmin MIDDLEWARE
router.post('/admin/create-test-menu', requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active food items
    const foodItems = await FoodItem.find({ status: 'active' });

    if (foodItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active food items found. Create food items first.'
      });
    }

    // Create menus for different meal times
    const mealTimes = ['breakfast', 'lunch', 'dinner'];
    const createdMenus = [];

    for (const mealTime of mealTimes) {
      // Check if menu already exists
      const existingMenu = await Menu.findOne({
        date: today,
        mealTime: mealTime
      });

      if (!existingMenu) {
        const menu = new Menu({
          date: today,
          mealTime: mealTime,
          foodItems: foodItems.map(item => ({
            item: item._id,
            available: true
          })),
          status: 'published'
        });

        await menu.save();
        createdMenus.push(menu);
        console.log(`✅ Created ${mealTime} menu with ${foodItems.length} items`);
      } else {
        console.log(`ℹ️ ${mealTime} menu already exists for today`);
        createdMenus.push(existingMenu);
      }
    }

    res.json({
      success: true,
      message: `Created ${createdMenus.length} menus for today`,
      data: { menus: createdMenus }
    });

  } catch (error) {
    console.error('Error creating test menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating test menu',
      error: error.message
    });
  }
});

module.exports = router;