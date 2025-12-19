const FoodItem = require('../models/Fooditem');
const Menu = require('../models/Menu'); // ADDED
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Get all food items with filtering and pagination
exports.getAllFoodItems = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      category, 
      mealTime,
      search, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;

    const filter = {};
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Meal Time filter
    if (mealTime) {
      filter.mealTime = mealTime;
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Sort configuration
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries in parallel for better performance
    const [foodItems, total] = await Promise.all([
      FoodItem.find(filter)
        .select('name price image category status averageRating totalReviews featured quantity discount mealTime createdAt updatedAt')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      FoodItem.countDocuments(filter)
    ]);

    // Calculate summary statistics
    const stats = {
      total: await FoodItem.countDocuments(),
      active: await FoodItem.countDocuments({ status: 'active' }),
      inactive: await FoodItem.countDocuments({ status: 'inactive' }),
      featured: await FoodItem.countDocuments({ featured: true, status: 'active' }),
      breakfast: await FoodItem.countDocuments({ mealTime: 'breakfast', status: 'active' }),
      lunch: await FoodItem.countDocuments({ mealTime: 'lunch', status: 'active' }),
      snack: await FoodItem.countDocuments({ mealTime: 'snack', status: 'active' }),
      dinner: await FoodItem.countDocuments({ mealTime: 'dinner', status: 'active' }),
      // Menu statistics
      publishedMenus: await Menu.countDocuments({ status: 'published' }),
      todayMenus: await Menu.countDocuments({ 
        date: { 
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        },
        status: 'published'
      })
    };

    res.json({
      success: true,
      data: {
        foodItems,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        },
        stats,
        filters: {
          status,
          category,
          mealTime,
          search,
          sortBy,
          sortOrder
        }
      }
    });
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food items',
      error: error.message
    });
  }
};

// Get single food item by ID
exports.getFoodItemById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const foodItem = await FoodItem.findById(id)
      .select('name price image category status averageRating totalReviews featured quantity discount mealTime description shortDescription dietaryTags nutritionalInfo slug popularity createdAt updatedAt');
    
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    res.json({
      success: true,
      data: foodItem
    });
  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food item',
      error: error.message
    });
  }
};

// Create new food item
exports.createFoodItem = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      discount = 0,
      quantity,
      category,
      mealTime,
      dietaryTags,
      nutritionalInfo,
      status = 'active',
      featured = false
    } = req.body;

    // Validate required fields
    if (!name || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and category are required fields'
      });
    }

    // Validate price
    if (isNaN(price) || parseFloat(price) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    // Validate discount
    if (discount && (isNaN(discount) || parseFloat(discount) < 0 || parseFloat(discount) > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Discount must be between 0 and 100'
      });
    }

    // Validate quantity
    if (quantity && (isNaN(quantity) || parseInt(quantity) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number'
      });
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-');

    // Check if slug already exists
    const existingItem = await FoodItem.findOne({ slug });
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'A food item with similar name already exists'
      });
    }

    // Handle image upload
    let image = '/uploads/default-food.jpg';
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    }

    // Parse dietary tags if provided as string
    let parsedDietaryTags = [];
    if (dietaryTags) {
      if (typeof dietaryTags === 'string') {
        parsedDietaryTags = dietaryTags.split(',').map(tag => tag.trim());
      } else if (Array.isArray(dietaryTags)) {
        parsedDietaryTags = dietaryTags;
      }
    }

    // Parse nutritional info if provided as string
    let parsedNutritionalInfo = {};
    if (nutritionalInfo) {
      try {
        parsedNutritionalInfo = typeof nutritionalInfo === 'string' 
          ? JSON.parse(nutritionalInfo) 
          : nutritionalInfo;
      } catch (error) {
        console.warn('Invalid nutritional info format:', error);
      }
    }

    // Create new food item
    const foodItem = new FoodItem({
      name,
      slug,
      description,
      shortDescription,
      price: parseFloat(price),
      discount: parseFloat(discount),
      quantity: quantity ? parseInt(quantity) : 0,
      category,
      mealTime: mealTime || null,
      dietaryTags: parsedDietaryTags,
      nutritionalInfo: parsedNutritionalInfo,
      image,
      status,
      featured: featured === 'true' || featured === true,
      averageRating: 0,
      totalReviews: 0,
      popularity: 0
    });

    await foodItem.save();

    res.status(201).json({
      success: true,
      message: 'Food item created successfully',
      data: foodItem
    });
  } catch (error) {
    console.error('Error creating food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating food item',
      error: error.message
    });
  }
};

// Update food item
exports.updateFoodItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find food item
    const foodItem = await FoodItem.findById(id);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Validate price if provided
    if (updates.price && (isNaN(updates.price) || parseFloat(updates.price) <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a positive number'
      });
    }

    // Validate discount if provided
    if (updates.discount && (isNaN(updates.discount) || parseFloat(updates.discount) < 0 || parseFloat(updates.discount) > 100)) {
      return res.status(400).json({
        success: false,
        message: 'Discount must be between 0 and 100'
      });
    }

    // Validate quantity if provided
    if (updates.quantity && (isNaN(updates.quantity) || parseInt(updates.quantity) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number'
      });
    }

    // Handle image upload if new image provided
    if (req.file) {
      // Delete old image if exists and it's not the default
      if (foodItem.image && foodItem.image.startsWith('/uploads/') && foodItem.image !== '/uploads/default-food.jpg') {
        const oldImagePath = path.join(__dirname, '..', 'public', foodItem.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Update with new image
      updates.image = `/uploads/${req.file.filename}`;
    }

    // Handle dietary tags parsing
    if (updates.dietaryTags) {
      if (typeof updates.dietaryTags === 'string') {
        updates.dietaryTags = updates.dietaryTags.split(',').map(tag => tag.trim());
      }
    }

    // Handle nutritional info parsing
    if (updates.nutritionalInfo && typeof updates.nutritionalInfo === 'string') {
      try {
        updates.nutritionalInfo = JSON.parse(updates.nutritionalInfo);
      } catch (error) {
        console.warn('Invalid nutritional info format:', error);
      }
    }

    // Update slug if name changed
    if (updates.name && updates.name !== foodItem.name) {
      const newSlug = updates.name.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-');
      
      // Check if new slug already exists
      const existingItem = await FoodItem.findOne({ slug: newSlug, _id: { $ne: id } });
      if (existingItem) {
        return res.status(400).json({
          success: false,
          message: 'Another food item with similar name already exists'
        });
      }
      
      updates.slug = newSlug;
    }

    // Update the food item
    Object.assign(foodItem, updates);
    foodItem.updatedAt = Date.now();
    
    await foodItem.save();

    res.json({
      success: true,
      message: 'Food item updated successfully',
      data: foodItem
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating food item',
      error: error.message
    });
  }
};

// Delete food item
exports.deleteFoodItem = async (req, res) => {
  try {
    const { id } = req.params;

    const foodItem = await FoodItem.findById(id);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Delete associated image if exists and it's not the default
    if (foodItem.image && foodItem.image.startsWith('/uploads/') && foodItem.image !== '/uploads/default-food.jpg') {
      const imagePath = path.join(__dirname, '..', 'public', foodItem.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Soft delete by updating status
    foodItem.status = 'deleted';
    foodItem.deletedAt = Date.now();
    foodItem.updatedAt = Date.now();
    await foodItem.save();

    // Also remove this item from any menus
    await Menu.updateMany(
      { 'foodItems.item': id },
      { $pull: { foodItems: { item: id } } }
    );

    res.json({
      success: true,
      message: 'Food item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting food item',
      error: error.message
    });
  }
};

// Update food item status
exports.updateFoodItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'out_of_stock'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: active, inactive, out_of_stock'
      });
    }

    const foodItem = await FoodItem.findById(id);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    foodItem.status = status;
    foodItem.updatedAt = Date.now();
    await foodItem.save();

    // If item is marked as inactive or out_of_stock, mark as unavailable in menus
    if (status !== 'active') {
      await Menu.updateMany(
        { 'foodItems.item': id },
        { $set: { 'foodItems.$.available': false } }
      );
    }

    res.json({
      success: true,
      message: `Food item status updated to ${status}`,
      data: foodItem
    });
  } catch (error) {
    console.error('Error updating food item status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating food item status',
      error: error.message
    });
  }
};

// Toggle featured status
exports.toggleFeatured = async (req, res) => {
  try {
    const { id } = req.params;

    const foodItem = await FoodItem.findById(id);
    if (!foodItem) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found'
      });
    }

    // Can only feature active items
    if (foodItem.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active food items can be featured'
      });
    }

    foodItem.featured = !foodItem.featured;
    foodItem.updatedAt = Date.now();
    await foodItem.save();

    res.json({
      success: true,
      message: `Food item ${foodItem.featured ? 'added to' : 'removed from'} featured`,
      data: foodItem
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling featured status',
      error: error.message
    });
  }
};

// Get food items for menu selection (optimized for menu creation)
exports.getFoodItemsForMenu = async (req, res) => {
  try {
    const { category, mealTime, search } = req.query;

    const filter = {
      status: 'active',
      quantity: { $gt: 0 }
    };

    if (category) {
      filter.category = category;
    }

    if (mealTime) {
      filter.mealTime = mealTime;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const foodItems = await FoodItem.find(filter)
      .select('name price image category mealTime dietaryTags featured quantity')
      .sort({ name: 1 })
      .limit(50);

    res.json({
      success: true,
      data: {
        foodItems,
        total: foodItems.length
      }
    });
  } catch (error) {
    console.error('Error fetching food items for menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching food items for menu',
      error: error.message
    });
  }
};

// Bulk upload from CSV
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required'
      });
    }

    const results = [];
    const errors = [];
    const filePath = req.file.path;

    // Read and parse CSV file
    const processCSV = new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          results.push(row);
        })
        .on('end', () => {
          resolve();
        })
        .on('error', reject);
    });

    await processCSV;

    // Process each row
    const processedItems = [];
    for (const row of results) {
      try {
        // Validate required fields
        if (!row.name || !row.price || !row.category) {
          errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
          continue;
        }

        // Generate slug
        const slug = row.name.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-');

        // Check if slug already exists
        const existingItem = await FoodItem.findOne({ slug });
        if (existingItem) {
          errors.push(`Item already exists: ${row.name}`);
          continue;
        }

        // Create food item
        const foodItem = new FoodItem({
          name: row.name,
          slug,
          description: row.description || '',
          shortDescription: row.shortDescription || '',
          price: parseFloat(row.price),
          discount: row.discount ? parseFloat(row.discount) : 0,
          quantity: row.quantity ? parseInt(row.quantity) : 0,
          category: row.category,
          mealTime: row.mealTime || null,
          dietaryTags: row.dietaryTags ? row.dietaryTags.split(',').map(tag => tag.trim()) : [],
          status: row.status || 'active',
          featured: row.featured === 'true',
          averageRating: 0,
          totalReviews: 0,
          popularity: 0
        });

        await foodItem.save();
        processedItems.push(foodItem);
      } catch (error) {
        errors.push(`Error processing ${row.name}: ${error.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Bulk upload completed',
      data: {
        processed: processedItems.length,
        errors: errors.length,
        details: {
          successful: processedItems.length,
          failed: errors.length,
          errorMessages: errors.slice(0, 10) // Limit error messages
        }
      }
    });
  } catch (error) {
    console.error('Error in bulk upload:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk upload',
      error: error.message
    });
  }
};

// Bulk delete
exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array of IDs is required'
      });
    }

    // Soft delete all items
    const result = await FoodItem.updateMany(
      { _id: { $in: ids } },
      { 
        status: 'deleted',
        deletedAt: Date.now(),
        updatedAt: Date.now()
      }
    );

    // Remove deleted items from menus
    await Menu.updateMany(
      { 'foodItems.item': { $in: ids } },
      { $pull: { foodItems: { item: { $in: ids } } } }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} food items deleted successfully`,
      data: {
        deletedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing bulk delete',
      error: error.message
    });
  }
};

// NEW: Create or update menu
exports.createOrUpdateMenu = async (req, res) => {
  try {
    const { date, mealType, cafeteria, foodItems } = req.body;

    // Validate required fields
    if (!date || !mealType || !cafeteria || !foodItems || !Array.isArray(foodItems)) {
      return res.status(400).json({
        success: false,
        message: 'Date, mealType, cafeteria, and foodItems array are required'
      });
    }

    const menuDate = new Date(date);
    menuDate.setHours(0, 0, 0, 0);

    // Check if menu already exists for this date and mealType
    let menu = await Menu.findOne({
      date: {
        $gte: menuDate,
        $lt: new Date(menuDate.getTime() + 24 * 60 * 60 * 1000)
      },
      mealType,
      cafeteria
    });

    // Prepare food items for menu
    const menuFoodItems = foodItems.map(itemId => ({
      item: itemId,
      available: true
    }));

    if (menu) {
      // Update existing menu
      menu.foodItems = menuFoodItems;
      menu.lastUpdated = Date.now();
      await menu.save();
    } else {
      // Create new menu
      menu = new Menu({
        date: menuDate,
        mealType,
        cafeteria,
        foodItems: menuFoodItems,
        status: 'published'
      });
      await menu.save();
    }

    res.json({
      success: true,
      message: `Menu ${menu ? 'updated' : 'created'} successfully`,
      data: menu
    });
  } catch (error) {
    console.error('Error creating/updating menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating/updating menu',
      error: error.message
    });
  }
};

// NEW: Get menu by date range
exports.getMenusByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, mealType, cafeteria } = req.query;

    const filter = { status: 'published' };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filter.date = {
        $gte: start,
        $lte: end
      };
    }

    if (mealType) {
      filter.mealType = mealType;
    }

    if (cafeteria) {
      filter.cafeteria = cafeteria;
    }

    const menus = await Menu.find(filter)
      .populate({
        path: 'foodItems.item',
        select: 'name price image category mealTime dietaryTags'
      })
      .sort({ date: 1, mealType: 1 })
      .lean();

    res.json({
      success: true,
      data: {
        menus,
        total: menus.length
      }
    });
  } catch (error) {
    console.error('Error fetching menus by date range:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching menus',
      error: error.message
    });
  }
};