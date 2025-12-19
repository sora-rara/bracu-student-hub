
const Menu = require('../models/Menu');
const FoodItem = require('../models/Fooditem');
const Review = require('../models/Review');

exports.getHomepageData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's menu
    const todaysMenu = await Menu.findOne({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      status: 'published'
    })
    .populate('foodItems.item', 'name price image shortDescription category dietaryTags averageRating totalReviews slug')
    .lean();

    // Get featured food items
    const featuredItems = await FoodItem.find({
      featured: true,
      status: 'active'
    })
    .select('name price image shortDescription category dietaryTags averageRating totalReviews slug featured')
    .limit(8)
    .lean();

    // Get recent reviews
    const recentReviews = await Review.find({ status: 'active' })
      .populate('foodItem', 'name image')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get statistics
    const totalItems = await FoodItem.countDocuments({ status: 'active' });
    const featuredCount = await FoodItem.countDocuments({ 
      featured: true, 
      status: 'active' 
    });

    res.json({
      success: true,
      data: {
        todaysMenu: todaysMenu || null,
        featuredItems: featuredItems || [],
        recentReviews: recentReviews || [],
        stats: {
          totalItems,
          featuredCount,
          avgRating: 4.5 // You can calculate this from reviews
        }
      }
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching homepage data',
      error: error.message
    });
  }
};

exports.getWeeklyCalendar = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    
    const calendar = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const menus = await Menu.find({
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        },
        status: 'published'
      })
      .populate('foodItems.item', 'name')
      .lean();
      
      const hasMenu = menus.length > 0;
      const totalItems = menus.reduce((total, menu) => total + (menu.foodItems?.length || 0), 0);
      const mealTypes = [...new Set(menus.map(menu => menu.mealType))];
      
      calendar.push({
        date: date.toISOString(),
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        hasMenu,
        totalItems,
        mealTypes
      });
    }
    
    res.json({
      success: true,
      data: {
        calendar
      }
    });
  } catch (error) {
    console.error('Error fetching weekly calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly calendar',
      error: error.message
    });
  }
};