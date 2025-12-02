const express = require('express');
const router = express.Router();
const cafeteriaController = require('../controllers/cafeteriaController');
const foodItemController = require('../controllers/foodItemController');
const upload = require('../middleware/upload');
const FoodItem = require('../models/Fooditem');
const Menu = require('../models/Menu');
const Review = require('../models/Review');

// ====================
// WEBSITE ROUTES (Public)
// ====================

// Homepage
router.get('/homepage', cafeteriaController.getHomepageData);

// Menu browsing
router.get('/menu/date/:date', cafeteriaController.getMenuByDate);
router.get('/menu/weekly-calendar', cafeteriaController.getWeeklyCalendar);

// Food item details
router.get('/food/:slug', cafeteriaController.getFoodItemPage);

// Search
router.get('/search', cafeteriaController.searchFoodItems);

// Review submission (no auth required for website)
router.post('/review', cafeteriaController.submitWebsiteReview);

// ====================
// ADMIN FOOD ITEM MANAGEMENT ROUTES
// ====================

// CRUD operations
router.get('/admin/food-items', foodItemController.getAllFoodItems);
router.get('/admin/food-items/:id', foodItemController.getFoodItemById);
router.post('/admin/food-items', upload.single('image'), foodItemController.createFoodItem);
router.put('/admin/food-items/:id', upload.single('image'), foodItemController.updateFoodItem);
router.delete('/admin/food-items/:id', foodItemController.deleteFoodItem);

// Status & featured toggles
router.patch('/admin/food-items/:id/status', foodItemController.updateFoodItemStatus);
router.patch('/admin/food-items/:id/featured', foodItemController.toggleFeatured);

// Bulk operations
router.post('/admin/food-items/bulk-upload', upload.single('csvFile'), foodItemController.bulkUpload);
router.delete('/admin/food-items/bulk-delete', foodItemController.bulkDelete);

// Food items for menu selection
router.get('/admin/food-items-for-menu', foodItemController.getFoodItemsForMenu);

// Menu-related routes (from foodItemController)
router.post('/admin/menus', foodItemController.createOrUpdateMenu);
router.get('/admin/menus-by-date', foodItemController.getMenusByDateRange);

// ====================
// MENU PUBLISHING ROUTES
// ====================

// Quick menu publish endpoint
router.post('/admin/publish-today', async (req, res) => {
  try {
    const { itemIds, mealType = 'lunch', cafeteria = 'main' } = req.body;
    
    if (!itemIds || !Array.isArray(itemIds)) {
      return res.status(400).json({
        success: false,
        message: 'Array of item IDs is required'
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if menu already exists for today
    let existingMenu = await Menu.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      mealType,
      cafeteria
    });
    
    // Prepare food items for menu
    const foodItems = itemIds.map(itemId => ({
      item: itemId,
      available: true
    }));
    
    if (existingMenu) {
      // Update existing menu
      existingMenu.foodItems = foodItems;
      existingMenu.lastUpdated = Date.now();
      await existingMenu.save();
    } else {
      // Create new menu
      existingMenu = new Menu({
        date: today,
        mealType,
        cafeteria,
        foodItems,
        status: 'published'
      });
      await existingMenu.save();
    }
    
    // Mark items as featured
    await FoodItem.updateMany(
      { _id: { $in: itemIds } },
      { featured: true, updatedAt: Date.now() }
    );
    
    res.json({
      success: true,
      message: `Menu published for ${mealType} (${cafeteria}) with ${itemIds.length} items`,
      data: existingMenu
    });
  } catch (error) {
    console.error('Error publishing menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing menu',
      error: error.message
    });
  }
});

// Get today's menu
router.get('/menu/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const menus = await Menu.find({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'published'
    })
    .populate({
      path: 'foodItems.item',
      select: 'name price image shortDescription category dietaryTags averageRating totalReviews slug featured quantity discount mealTime status'
    })
    .lean();

    if (menus.length === 0) {
      return res.json({
        success: true,
        data: {
          date: today.toISOString(),
          menus: [],
          message: 'No menu published for today'
        }
      });
    }

    // Increment views for each menu
    for (const menu of menus) {
      await Menu.findByIdAndUpdate(menu._id, { $inc: { views: 1 } });
    }

    res.json({
      success: true,
      data: {
        date: today.toISOString(),
        menus,
        totalItems: menus.reduce((total, menu) => total + (menu.foodItems?.length || 0), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s menu',
      error: error.message
    });
  }
});

// Get upcoming menus (next 7 days)
router.get('/menu/upcoming', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingMenus = await Menu.find({
      date: {
        $gte: today,
        $lt: nextWeek
      },
      status: 'published'
    })
    .select('date mealType cafeteria foodItems status')
    .populate({
      path: 'foodItems.item',
      select: 'name category price image featured'
    })
    .sort({ date: 1, mealType: 1 })
    .lean();

    res.json({
      success: true,
      data: {
        menus: upcomingMenus,
        count: upcomingMenus.length,
        dateRange: {
          start: today.toISOString(),
          end: nextWeek.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching upcoming menus:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming menus',
      error: error.message
    });
  }
});

// Get menu by date and cafeteria
router.get('/menu/:date/:cafeteria', async (req, res) => {
  try {
    const { date, cafeteria } = req.params;
    const menuDate = new Date(date);
    menuDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(menuDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const menu = await Menu.findOne({
      date: {
        $gte: menuDate,
        $lt: nextDay
      },
      cafeteria: cafeteria,
      status: 'published'
    })
    .populate({
      path: 'foodItems.item',
      select: 'name price image shortDescription category dietaryTags averageRating totalReviews slug featured quantity discount mealTime status'
    })
    .lean();

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found for the specified date and cafeteria'
      });
    }

    // Increment views
    await Menu.findByIdAndUpdate(menu._id, { $inc: { views: 1 } });

    res.json({
      success: true,
      data: menu
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menu',
      error: error.message
    });
  }
});

// ====================
// STATISTICS & HEALTH CHECK
// ====================

// Statistics for website
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      totalFoodItems: await FoodItem.countDocuments({ status: 'active' }),
      totalReviews: await Review.countDocuments(),
      totalMenus: await Menu.countDocuments({ status: 'published' }),
      todaysMenus: await Menu.countDocuments({ 
        date: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(24, 0, 0, 0))
        },
        status: 'published'
      }),
      website: {
        name: 'BRACU Cafeteria Website',
        version: '1.0.0'
      }
    };
    res.json({ 
      success: true, 
      data: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics',
      error: error.message 
    });
  }
});

// Add a health check endpoint for verification
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      website: [
        '/homepage',
        '/menu/date/:date',
        '/menu/weekly-calendar',
        '/menu/today',
        '/menu/upcoming',
        '/menu/:date/:cafeteria',
        '/food/:slug',
        '/search',
        '/review',
        '/stats'
      ],
      admin: {
        foodItems: [
          '/admin/food-items',
          '/admin/food-items/:id',
          '/admin/food-items-for-menu',
          '/admin/food-items/bulk-upload',
          '/admin/food-items/bulk-delete'
        ],
        menus: [
          '/admin/menus',
          '/admin/menus-by-date',
          '/admin/publish-today'
        ]
      },
      system: [
        '/health'
      ]
    }
  });
});

module.exports = router;