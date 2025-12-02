const Menu = require('../models/Menu');
const FoodItem = require('../models/Fooditem');
const Review = require('../models/Review');

// Website Homepage Data
exports.getHomepageData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's menu
    const todaysMenu = await Menu.findOne({
      date: today,
      status: 'published'
    }).populate({
      path: 'foodItems.item',
      select: 'name price image dietaryTags category averageRating totalReviews description shortDescription discount'
    });

    // Get featured items with reviews
    const featuredItems = await FoodItem.find({
      featured: true,
      status: 'active'
    })
    .select('name price image category averageRating totalReviews description shortDescription discount dietaryTags')
    .limit(6);

    // Get recent reviews with food item info
    const recentReviews = await Review.find({ status: 'active' })
      .populate('foodItem', 'name slug image')
      .sort('-createdAt')
      .limit(10);

    res.json({
      success: true,
      data: {
        todaysMenu,
        featuredItems,
        recentReviews,
        stats: {
          totalItems: await FoodItem.countDocuments({ status: 'active' }),
          totalReviews: await Review.countDocuments({ status: 'active' }),
          todayViews: todaysMenu?.views || 0
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

// Get Menu for Specific Date (Website Page)
exports.getMenuByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const menuDate = new Date(date);
    
    const menus = await Menu.find({
      date: menuDate,
      status: 'published'
    })
    .populate({
      path: 'foodItems.item',
      select: 'name price image dietaryTags category averageRating totalReviews description discount'
    })
    .sort('mealType');

    // Group by cafeteria for website display
    const groupedMenus = menus.reduce((acc, menu) => {
      const cafeteria = menu.cafeteria;
      if (!acc[cafeteria]) {
        acc[cafeteria] = [];
      }
      acc[cafeteria].push(menu);
      return acc;
    }, {});

    // Increment views for analytics
    if (menus.length > 0) {
      await Promise.all(menus.map(menu => {
        menu.views += 1;
        return menu.save();
      }));
    }

    res.json({
      success: true,
      data: {
        date: menuDate,
        menus: groupedMenus,
        totalItems: menus.reduce((sum, menu) => sum + menu.foodItems.length, 0)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Food Item Details Page
exports.getFoodItemPage = async (req, res) => {
  try {
    const { slug } = req.params;

    const foodItem = await FoodItem.findOne({ slug })
      .select('name price image category averageRating totalReviews description shortDescription discount dietaryTags nutritionalInfo featured')
      .populate({
        path: 'reviews',
        match: { status: 'active' },
        options: {
          sort: { createdAt: -1 },
          limit: 20
        }
      });

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Get related items
    const relatedItems = await FoodItem.find({
      category: foodItem.category,
      _id: { $ne: foodItem._id },
      status: 'active'
    })
    .select('name price image category averageRating totalReviews shortDescription')
    .limit(4);

    // Update popularity
    foodItem.popularity += 1;
    await foodItem.save();

    res.json({
      success: true,
      data: {
        foodItem,
        relatedItems
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Submit Review from Website
exports.submitWebsiteReview = async (req, res) => {
  try {
    const { foodItemId, rating, comment, userName, userEmail } = req.body;

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Find food item
    const foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Create review
    const review = new Review({
      foodItem: foodItemId,
      userName,
      userEmail,
      rating,
      comment,
      status: 'active'
    });

    await review.save();

    // Update food item rating statistics
    const reviews = await Review.find({ foodItem: foodItemId, status: 'active' });
    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = totalRating / reviews.length;

    foodItem.averageRating = parseFloat(averageRating.toFixed(1));
    foodItem.totalReviews = reviews.length;
    await foodItem.save();

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Search Food Items for Website
exports.searchFoodItems = async (req, res) => {
  try {
    const { q, category, dietary, minPrice, maxPrice, sort = 'popularity', page = 1, limit = 12 } = req.query;

    const filter = { status: 'active' };

    // Text search
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { 'dietaryTags': { $regex: q, $options: 'i' } }
      ];
    }

    // Category filter
    if (category) {
      filter.category = category;
    }

    // Dietary filter
    if (dietary) {
      filter.dietaryTags = dietary;
    }

    // Price filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Sort options
    const sortOptions = {
      'popularity': { popularity: -1 },
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      'name': { name: 1 },
      'newest': { createdAt: -1 },
      'rating': { averageRating: -1 }
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      FoodItem.find(filter)
        .select('name price image category averageRating totalReviews shortDescription discount dietaryTags')
        .sort(sortOptions[sort] || sortOptions.popularity)
        .skip(skip)
        .limit(Number(limit)),
      FoodItem.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: Number(limit)
        },
        filters: {
          query: q,
          category,
          dietary,
          priceRange: { min: minPrice, max: maxPrice }
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get Weekly Menu Calendar
exports.getWeeklyCalendar = async (req, res) => {
  try {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    const weeklyMenus = await Menu.find({
      date: { $gte: startOfWeek },
      status: 'published'
    })
    .populate('foodItems.item', 'name price category averageRating image')
    .sort('date mealType');

    // Organize by date for calendar view
    const calendarData = weekDays.map(date => {
      const dayMenus = weeklyMenus.filter(menu => 
        menu.date.toDateString() === date.toDateString()
      );
      
      return {
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        hasMenu: dayMenus.length > 0,
        mealTypes: dayMenus.map(menu => menu.mealType),
        totalItems: dayMenus.reduce((sum, menu) => sum + menu.foodItems.length, 0)
      };
    });

    res.json({
      success: true,
      data: {
        weekStart: startOfWeek,
        calendar: calendarData,
        summary: {
          totalDaysWithMenu: calendarData.filter(day => day.hasMenu).length,
          totalItems: calendarData.reduce((sum, day) => sum + day.totalItems, 0)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};