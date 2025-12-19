// controllers/FooditemController.js
const FoodItem = require('../models/Fooditem');
const Menu = require('../models/Menu');
const Review = require('../models/Review');
const fs = require('fs');
const path = require('path');

// Path to uploads directory
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ✅ HELPER FUNCTION: Generate unique slug
const generateUniqueSlug = (name) => {
  if (!name) return `item-${Date.now()}`;

  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, '')      // Remove special characters
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-+/, '')            // Remove leading hyphens
    .replace(/-+$/, '');           // Remove trailing hyphens

  const slugBase = baseSlug || 'item';
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000);

  return `${slugBase}-${timestamp}-${randomSuffix}`;
};

// Create new food item - AUTOMATICALLY ADDS TO TODAY'S MENU
exports.createFoodItem = async (req, res) => {
  try {
    console.log('=== CREATE FOOD ITEM ===');
    console.log('Body:', req.body);
    console.log('File received:', req.file ? 'Yes' : 'No');

    // Extract data from request body
    const {
      name,
      description,
      shortDescription,
      price,
      quantity,
      category,
      mealTime,
      status,
      featured,
      dietaryTags
    } = req.body;

    // Validate required fields
    if (!name || !price || !category || !mealTime) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, price, category, mealTime'
      });
    }

    // Handle file upload
    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      console.log('✅ Image saved:', imageUrl);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Food image is required'
      });
    }

    // Parse dietary tags
    let parsedDietaryTags = [];
    if (dietaryTags) {
      if (typeof dietaryTags === 'string') {
        parsedDietaryTags = dietaryTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(dietaryTags)) {
        parsedDietaryTags = dietaryTags;
      }
    }

    // ✅ Generate unique slug
    const slug = generateUniqueSlug(name);
    console.log('✅ Generated slug:', slug);

    // Create new food item
    const newFoodItem = new FoodItem({
      name,
      slug: slug, // ✅ Add the generated slug
      description: description || '',
      shortDescription: shortDescription || (description ? description.substring(0, 100) + '...' : ''),
      price: parseFloat(price),
      quantity: parseInt(quantity) || 0,
      category,
      mealTime,
      dietaryTags: parsedDietaryTags,
      image: imageUrl,
      status: status || 'active',
      featured: featured === 'true' || featured === true
    });

    // Save to database
    const savedItem = await newFoodItem.save();
    console.log('✅ Food item saved to database:', savedItem._id);

    // AUTOMATICALLY ADD TO TODAY'S MENU
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find today's menu for this meal time
      let todaysMenu = await Menu.findOne({
        date: today,
        mealTime: savedItem.mealTime
      });

      if (!todaysMenu) {
        // Create new menu for today
        todaysMenu = new Menu({
          date: today,
          mealTime: savedItem.mealTime,
          foodItems: [],
          status: 'published'
        });
        console.log(`📅 Created new ${savedItem.mealTime} menu for today`);
      }

      // Check if item already exists in menu
      const itemExists = todaysMenu.foodItems.some(
        item => item.item && item.item.toString() === savedItem._id.toString()
      );

      if (!itemExists) {
        // Add item to menu
        todaysMenu.foodItems.push({
          item: savedItem._id,
          available: true
        });

        await todaysMenu.save();
        console.log(`✅ Added "${savedItem.name}" to ${savedItem.mealTime} menu`);
      } else {
        console.log(`ℹ️ Item already exists in today's ${savedItem.mealTime} menu`);
      }
    } catch (menuError) {
      console.error('❌ Error adding to menu:', menuError.message);
      // Don't fail the whole request if menu addition fails
    }

    res.status(201).json({
      success: true,
      message: 'Food item created successfully and added to today\'s menu',
      data: { foodItem: savedItem }
    });

  } catch (error) {
    console.error('❌ Error creating food item:', error);

    // Handle specific errors
    if (error.code === 11000) {
      // Handle duplicate slug error
      if (error.keyPattern?.slug) {
        return res.status(400).json({
          success: false,
          message: 'Food item with similar name already exists. Please try again with a slightly different name.',
          error: 'Duplicate slug error'
        });
      }

      return res.status(400).json({
        success: false,
        message: 'Food item with this name already exists'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating food item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get all food items (for admin)
exports.getAllFoodItems = async (req, res) => {
  try {
    const { featured, category, mealTime, status } = req.query;
    const filter = {};

    if (featured !== undefined) filter.featured = featured === 'true';
    if (category) filter.category = category;
    if (mealTime) filter.mealTime = mealTime;
    if (status) filter.status = status;

    const foodItems = await FoodItem.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { foodItems }
    });
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching food items'
    });
  }
};

// Get single food item by ID
exports.getFoodItemById = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.json({
      success: true,
      data: { foodItem }
    });
  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching food item'
    });
  }
};

// Update food item
exports.updateFoodItem = async (req, res) => {
  try {
    console.log('=== UPDATE FOOD ITEM ===');
    console.log('Item ID:', req.params.id);
    console.log('File:', req.file ? 'New file received' : 'No new file');

    const {
      name,
      description,
      shortDescription,
      price,
      quantity,
      category,
      mealTime,
      dietaryTags,
      status,
      featured
    } = req.body;

    // Find existing item
    const existingItem = await FoodItem.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // ✅ Regenerate slug if name is being changed
    let slug = existingItem.slug;
    if (name && name !== existingItem.name) {
      slug = generateUniqueSlug(name);
      console.log('🔄 Regenerated slug for name change:', slug);
    }

    // Handle file upload if new image
    let imageUrl = existingItem.image;
    if (req.file) {
      // Delete old image if exists
      if (existingItem.image && existingItem.image.startsWith('/uploads/')) {
        try {
          const oldFilename = existingItem.image.replace('/uploads/', '');
          const oldImagePath = path.join(uploadsDir, oldFilename);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('🗑️ Deleted old image:', oldFilename);
          }
        } catch (deleteError) {
          console.warn('Could not delete old image:', deleteError.message);
        }
      }

      // Use new image
      imageUrl = `/uploads/${req.file.filename}`;
      console.log('✅ New image URL:', imageUrl);
    }

    // Parse dietary tags
    let parsedDietaryTags = existingItem.dietaryTags;
    if (dietaryTags !== undefined) {
      if (typeof dietaryTags === 'string') {
        parsedDietaryTags = dietaryTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      } else if (Array.isArray(dietaryTags)) {
        parsedDietaryTags = dietaryTags;
      }
    }

    // Update item
    const updatedItem = await FoodItem.findByIdAndUpdate(
      req.params.id,
      {
        name: name || existingItem.name,
        slug: slug, // ✅ Include slug in update
        description: description !== undefined ? description : existingItem.description,
        shortDescription: shortDescription !== undefined ? shortDescription : existingItem.shortDescription,
        price: price !== undefined ? parseFloat(price) : existingItem.price,
        quantity: quantity !== undefined ? parseInt(quantity) : existingItem.quantity,
        category: category || existingItem.category,
        mealTime: mealTime !== undefined ? mealTime : existingItem.mealTime,
        dietaryTags: parsedDietaryTags,
        image: imageUrl,
        status: status || existingItem.status,
        featured: featured !== undefined ? (featured === 'true' || featured === true) : existingItem.featured,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    console.log('✅ Food item updated:', updatedItem._id);

    res.json({
      success: true,
      message: 'Food item updated successfully',
      data: { foodItem: updatedItem }
    });
  } catch (error) {
    console.error('❌ Error updating food item:', error);

    // Handle specific errors
    if (error.code === 11000 && error.keyPattern?.slug) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists. Please try a different name.',
        error: 'Duplicate slug error'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error updating food item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete food item
exports.deleteFoodItem = async (req, res) => {
  try {
    const foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Delete image file if exists
    if (foodItem.image && foodItem.image.startsWith('/uploads/')) {
      try {
        const filename = foodItem.image.replace('/uploads/', '');
        const imagePath = path.join(uploadsDir, filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('🗑️ Deleted image file:', filename);
        }
      } catch (deleteError) {
        console.warn('Could not delete image file:', deleteError.message);
      }
    }

    // Remove from any menus
    await Menu.updateMany(
      { 'foodItems.item': foodItem._id },
      { $pull: { foodItems: { item: foodItem._id } } }
    );

    // Delete from database
    await FoodItem.findByIdAndDelete(req.params.id);

    console.log('✅ Food item deleted from database');

    res.json({
      success: true,
      message: 'Food item deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting food item:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting food item',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get today's menu
exports.getTodaysMenu = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's menus
    const todaysMenus = await Menu.find({
      date: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'published'
    }).populate({
      path: 'foodItems.item',
      model: 'FoodItem',
      select: 'name price category mealTime image dietaryTags averageRating totalReviews description shortDescription featured status'
    });

    // Get all food items for review dropdown
    const allFoodItems = await FoodItem.find({ status: 'active' })
      .select('name price category mealTime image')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        menus: todaysMenus,
        allFoodItems: allFoodItems
      }
    });
  } catch (error) {
    console.error('Error fetching today\'s menu:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching today\'s menu'
    });
  }
};

// Get featured items
exports.getFeaturedItems = async (req, res) => {
  try {
    const featuredItems = await FoodItem.find({
      featured: true,
      status: 'active'
    })
      .select('name price category mealTime image dietaryTags averageRating totalReviews description shortDescription featured')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { featuredItems }
    });
  } catch (error) {
    console.error('Error fetching featured items:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching featured items'
    });
  }
};

// Get weekly calendar - FIXED
exports.getWeeklyCalendar = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Fetch all menus for the week
    const weeklyMenus = await Menu.find({
      date: {
        $gte: startOfWeek,
        $lt: endOfWeek
      },
      status: 'published'
    })
      .populate({
        path: 'foodItems.item',
        model: 'FoodItem',
        select: 'name price category mealTime image'
      })
      .sort({ date: 1, mealTime: 1 });

    // Format calendar for 7 days
    const formattedCalendar = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);

      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const dateStr = currentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      // Find menus for this specific day
      const menusForDay = weeklyMenus.filter(menu => {
        const menuDate = new Date(menu.date);
        return menuDate.getDate() === currentDate.getDate() &&
          menuDate.getMonth() === currentDate.getMonth() &&
          menuDate.getFullYear() === currentDate.getFullYear();
      });

      // Extract all items from menus for this day
      const allItems = [];
      menusForDay.forEach(menu => {
        if (menu.foodItems && menu.foodItems.length > 0) {
          menu.foodItems.forEach(fi => {
            if (fi.item) {
              allItems.push({
                _id: fi.item._id,
                name: fi.item.name,
                price: fi.item.price,
                image: fi.item.image,
                category: fi.item.category,
                mealTime: menu.mealTime
              });
            }
          });
        }
      });

      formattedCalendar.push({
        dayName,
        date: dateStr,
        isoDate: currentDate.toISOString(),
        menuItems: allItems,
        hasMenu: allItems.length > 0,
        mealTimes: [...new Set(menusForDay.map(m => m.mealTime))]
      });
    }

    // Calculate summary
    const totalDaysWithMenu = formattedCalendar.filter(day => day.hasMenu).length;
    const totalItems = formattedCalendar.reduce((sum, day) => sum + day.menuItems.length, 0);

    res.json({
      success: true,
      data: {
        weekStart: startOfWeek,
        weekEnd: endOfWeek,
        calendar: formattedCalendar,
        summary: {
          totalDaysWithMenu,
          totalItems,
          totalMealTypes: [...new Set(weeklyMenus.map(m => m.mealTime))].length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching weekly calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching weekly calendar',
      error: error.message
    });
  }
};

// Toggle item status
exports.toggleFoodItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const foodItem = await FoodItem.findById(id);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    const newStatus = status || (foodItem.status === 'active' ? 'inactive' : 'active');
    const updatedItem = await FoodItem.findByIdAndUpdate(
      id,
      { status: newStatus, updatedAt: Date.now() },
      { new: true }
    );

    res.json({
      success: true,
      message: `Food item status updated to ${updatedItem.status}`,
      data: { foodItem: updatedItem }
    });
  } catch (error) {
    console.error('Error toggling food item status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling food item status'
    });
  }
};

// Toggle featured status
exports.toggleFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;

    const foodItem = await FoodItem.findById(id);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    const newFeatured = featured !== undefined ? featured : !foodItem.featured;
    const updatedItem = await FoodItem.findByIdAndUpdate(
      id,
      { featured: newFeatured, updatedAt: Date.now() },
      { new: true }
    );

    res.json({
      success: true,
      message: `Food item featured status updated to ${updatedItem.featured}`,
      data: { foodItem: updatedItem }
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling featured status'
    });
  }
};