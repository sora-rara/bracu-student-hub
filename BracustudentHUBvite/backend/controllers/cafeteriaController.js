const Menu = require('../models/Menu');
const FoodItem = require('../models/Fooditem');
const Review = require('../models/Review');

// Get homepage data
exports.getHomepageData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's menu
    const todaysMenu = await Menu.find({
      date: today,
      status: 'published'
    })
    .populate({
      path: 'foodItems.item',
      select: 'name price image category averageRating totalReviews description shortDescription dietaryTags featured'
    })
    .sort({ mealTime: 1 });

    // Get featured items
    const featuredItems = await FoodItem.find({
      featured: true,
      status: 'active'
    })
    .select('name price image category averageRating totalReviews description shortDescription dietaryTags')
    .limit(8);

    // Get recent reviews
    const recentReviews = await Review.find({ status: 'approved' })
      .populate('foodItem', 'name image')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get statistics
    const stats = {
      totalItems: await FoodItem.countDocuments({ status: 'active' }),
      totalReviews: await Review.countDocuments({ status: 'approved' }),
      featuredCount: await FoodItem.countDocuments({ featured: true, status: 'active' }),
      todaysMenuCount: todaysMenu.reduce((total, menu) => total + (menu.foodItems?.length || 0), 0)
    };

    res.json({
      success: true,
      data: {
        todaysMenu,
        featuredItems,
        recentReviews,
        stats
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

// Get menu by specific date
exports.getMenuByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const menuDate = new Date(date);
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
      select: 'name price image category averageRating totalReviews description dietaryTags'
    })
    .sort({ mealTime: 1 });

    // Increment views for each menu
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
};

// Get food item details by slug
exports.getFoodItemPage = async (req, res) => {
  try {
    const { slug } = req.params;

    const foodItem = await FoodItem.findOne({ slug })
      .select('name price image category averageRating totalReviews description shortDescription dietaryTags featured')
      .populate({
        path: 'reviews',
        match: { status: 'approved' },
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
    foodItem.popularity = (foodItem.popularity || 0) + 1;
    await foodItem.save();

    res.json({
      success: true,
      data: {
        foodItem,
        relatedItems
      }
    });
  } catch (error) {
    console.error('Error fetching food item page:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food item',
      error: error.message
    });
  }
};

// Submit review
exports.submitWebsiteReview = async (req, res) => {
  try {
    const { foodItemId, rating, comment, userName, userEmail } = req.body;

    // Validate
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

    // Create review
    const review = new Review({
      foodItem: foodItemId,
      userName: userName || 'Anonymous',
      userEmail: userEmail || '',
      rating: parseInt(rating),
      comment,
      status: 'approved'
    });

    await review.save();

    // Update food item rating statistics
    const reviews = await Review.find({ 
      foodItem: foodItemId, 
      status: 'approved' 
    });
    
    const totalRating = reviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length) : 0;

    foodItem.averageRating = parseFloat(averageRating.toFixed(1));
    foodItem.totalReviews = reviews.length;
    await foodItem.save();

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting review',
      error: error.message
    });
  }
};

// Search food items
exports.searchFoodItems = async (req, res) => {
  try {
    const { q, category, dietary, minPrice, maxPrice, sort = 'name', page = 1, limit = 12 } = req.query;

    const filter = { status: 'active' };

    // Text search
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } }
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
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Sort options
    const sortOptions = {
      'name': { name: 1 },
      'price-low': { price: 1 },
      'price-high': { price: -1 },
      'rating': { averageRating: -1 },
      'popularity': { popularity: -1 },
      'newest': { createdAt: -1 }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      FoodItem.find(filter)
        .select('name price image category averageRating totalReviews shortDescription dietaryTags')
        .sort(sortOptions[sort] || sortOptions.name)
        .skip(skip)
        .limit(parseInt(limit)),
      FoodItem.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error searching food items:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching food items',
      error: error.message
    });
  }
};

// Get weekly calendar
exports.getWeeklyCalendar = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

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
    .populate({
      path: 'foodItems.item',
      select: 'name price category averageRating image'
    })
    .sort({ date: 1, mealTime: 1 });

    // Organize by date
    const calendarData = weekDays.map(date => {
      const dayMenus = weeklyMenus.filter(menu => {
        const menuDate = new Date(menu.date);
        return menuDate.getDate() === date.getDate() &&
               menuDate.getMonth() === date.getMonth() &&
               menuDate.getFullYear() === date.getFullYear();
      });
      
      const totalItems = dayMenus.reduce((sum, menu) => sum + (menu.foodItems?.length || 0), 0);
      const mealTypes = [...new Set(dayMenus.map(menu => menu.mealTime))];

      return {
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        hasMenu: totalItems > 0,
        totalItems,
        mealTypes
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
    console.error('Error fetching weekly calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly calendar',
      error: error.message
    });
  }
};