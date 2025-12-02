// [file name]: server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const csv = require('csv-parser');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from backend/public directory
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`✅ Created uploads directory: ${uploadsDir}`);
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'food-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = file.mimetype.startsWith('image/');
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bracu_cafeteria';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => {
    console.log('❌ MongoDB connection error:', err.message);
    console.log('💡 Trying to start MongoDB if not running:');
    console.log('   Windows: Run "mongod" in command prompt');
    console.log('   Mac/Linux: Run "sudo service mongod start" or "brew services start mongodb-community"');
  });

// Import models
require('./models/Fooditem');
require('./models/Menu');
require('./models/Review');

// Test data insertion function
const insertTestData = async () => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    
    // Check if we have any food items
    const count = await FoodItem.countDocuments();
    
    if (count === 0) {
      console.log('📝 Inserting test data...');
      
      // Create test food items
      const testItems = [
        {
          name: 'Chicken Burger',
          slug: 'chicken-burger',
          description: 'Juicy chicken burger with fresh vegetables and special sauce',
          shortDescription: 'Delicious chicken burger with special sauce',
          price: 250,
          discount: 10,
          quantity: 50,
          category: 'main_course',
          mealTime: 'lunch',
          dietaryTags: ['spicy'],
          image: '',
          status: 'active',
          featured: true,
          averageRating: 4.5,
          totalReviews: 10
        },
        {
          name: 'Vegetable Pizza',
          slug: 'vegetable-pizza',
          description: 'Fresh vegetable pizza with mozzarella cheese and tomato sauce',
          shortDescription: 'Cheesy vegetable pizza',
          price: 350,
          quantity: 30,
          category: 'main_course',
          mealTime: 'dinner',
          dietaryTags: ['vegetarian'],
          image: '',
          status: 'active',
          featured: true,
          averageRating: 4.2,
          totalReviews: 8
        },
        {
          name: 'French Fries',
          slug: 'french-fries',
          description: 'Crispy golden fries served with ketchup',
          shortDescription: 'Crispy fries',
          price: 120,
          quantity: 100,
          category: 'snack',
          mealTime: 'snack',
          image: '',
          status: 'active',
          featured: false,
          averageRating: 4.0,
          totalReviews: 15
        },
        {
          name: 'Chocolate Cake',
          slug: 'chocolate-cake',
          description: 'Rich chocolate cake with creamy frosting',
          shortDescription: 'Delicious chocolate cake',
          price: 180,
          discount: 15,
          quantity: 20,
          category: 'dessert',
          mealTime: 'snack',
          dietaryTags: ['vegetarian'],
          image: '',
          status: 'active',
          featured: true,
          averageRating: 4.8,
          totalReviews: 12
        }
      ];
      
      await FoodItem.insertMany(testItems);
      console.log('✅ Test food items inserted');
    }
  } catch (error) {
    console.error('❌ Error inserting test data:', error);
  }
};

// ========== FOOD ITEM ADMIN API ENDPOINTS ==========
// These are the endpoints that fooditem.html expects

// Get all food items with pagination
app.get('/api/cafeteria/admin/food-items', async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    
    // Get total count
    const total = await FoodItem.countDocuments(query);
    
    // Get paginated items
    const foodItems = await FoodItem.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Calculate stats
    const totalItems = await FoodItem.countDocuments({ status: { $ne: 'deleted' } });
    const featuredItems = await FoodItem.countDocuments({ featured: true, status: { $ne: 'deleted' } });
    const activeItems = await FoodItem.countDocuments({ status: 'active' });
    const outOfStockItems = await FoodItem.countDocuments({ status: 'out_of_stock' });
    
    res.json({
      success: true,
      data: {
        foodItems: foodItems.map(item => ({
          ...item,
          _id: item._id.toString()
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total
        },
        stats: {
          total: totalItems,
          featured: featuredItems,
          active: activeItems,
          out_of_stock: outOfStockItems
        }
      }
    });
  } catch (error) {
    console.error('Error fetching food items:', error);
    res.status(500).json({ success: false, message: 'Error fetching food items', error: error.message });
  }
});

// Get single food item
app.get('/api/cafeteria/admin/food-items/:id', async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    
    const item = await FoodItem.findById(req.params.id).lean();
    if (!item) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }
    
    res.json({
      success: true,
      data: {
        ...item,
        _id: item._id.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching food item:', error);
    res.status(500).json({ success: false, message: 'Error fetching food item', error: error.message });
  }
});

// Create new food item
app.post('/api/cafeteria/admin/food-items', upload.single('image'), async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    
    const {
      name,
      description,
      shortDescription,
      price,
      discount,
      quantity,
      category,
      mealTime,
      status,
      featured
    } = req.body;
    
    // Parse dietary tags
    let dietaryTags = [];
    if (req.body.dietaryTags) {
      if (Array.isArray(req.body.dietaryTags)) {
        dietaryTags = req.body.dietaryTags;
      } else {
        dietaryTags = [req.body.dietaryTags];
      }
    }
    
    // Handle featured checkbox
    const isFeatured = featured === 'true' || featured === true;
    
    // Create slug from name
    const slug = name.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    
    // Create food item
    const foodItem = new FoodItem({
      name,
      slug,
      description: description || '',
      shortDescription: shortDescription || '',
      price: parseFloat(price) || 0,
      discount: parseFloat(discount) || 0,
      quantity: parseInt(quantity) || 0,
      category,
      mealTime: mealTime || '',
      dietaryTags,
      image: req.file ? req.file.filename : '',
      status: status || 'active',
      featured: isFeatured,
      averageRating: 0,
      totalReviews: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await foodItem.save();
    
    res.json({
      success: true,
      data: foodItem,
      message: 'Food item created successfully'
    });
  } catch (error) {
    console.error('Error creating food item:', error);
    res.status(500).json({ success: false, message: 'Error creating food item', error: error.message });
  }
});

// Update food item
app.put('/api/cafeteria/admin/food-items/:id', upload.single('image'), async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    
    const {
      name,
      description,
      shortDescription,
      price,
      discount,
      quantity,
      category,
      mealTime,
      status,
      featured
    } = req.body;
    
    // Parse dietary tags
    let dietaryTags = [];
    if (req.body.dietaryTags) {
      if (Array.isArray(req.body.dietaryTags)) {
        dietaryTags = req.body.dietaryTags;
      } else {
        dietaryTags = [req.body.dietaryTags];
      }
    }
    
    // Handle featured checkbox
    const isFeatured = featured === 'true' || featured === true;
    
    // Find and update
    const updateData = {
      name,
      description: description || '',
      shortDescription: shortDescription || '',
      price: parseFloat(price) || 0,
      discount: parseFloat(discount) || 0,
      quantity: parseInt(quantity) || 0,
      category,
      mealTime: mealTime || '',
      dietaryTags,
      status: status || 'active',
      featured: isFeatured,
      updatedAt: new Date()
    };
    
    // If new image uploaded, update image
    if (req.file) {
      updateData.image = req.file.filename;
    }
    
    const foodItem = await FoodItem.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!foodItem) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }
    
    res.json({
      success: true,
      data: foodItem,
      message: 'Food item updated successfully'
    });
  } catch (error) {
    console.error('Error updating food item:', error);
    res.status(500).json({ success: false, message: 'Error updating food item', error: error.message });
  }
});

// Delete food item
app.delete('/api/cafeteria/admin/food-items/:id', async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    
    const foodItem = await FoodItem.findByIdAndDelete(req.params.id);
    
    if (!foodItem) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }
    
    res.json({
      success: true,
      message: 'Food item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting food item:', error);
    res.status(500).json({ success: false, message: 'Error deleting food item', error: error.message });
  }
});

// Bulk delete food items
app.delete('/api/cafeteria/admin/food-items/bulk-delete', async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No items selected' });
    }
    
    const result = await FoodItem.deleteMany({ _id: { $in: ids } });
    
    res.json({
      success: true,
      message: `${result.deletedCount} items deleted successfully`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    console.error('Error bulk deleting food items:', error);
    res.status(500).json({ success: false, message: 'Error deleting food items', error: error.message });
  }
});

// Toggle featured status
app.patch('/api/cafeteria/admin/food-items/:id/featured', async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    const { featured } = req.body;
    
    const foodItem = await FoodItem.findByIdAndUpdate(
      req.params.id,
      { featured: featured, updatedAt: new Date() },
      { new: true }
    );
    
    if (!foodItem) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }
    
    res.json({
      success: true,
      message: `Item ${featured ? 'featured' : 'unfeatured'} successfully`,
      data: foodItem
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);
    res.status(500).json({ success: false, message: 'Error updating featured status', error: error.message });
  }
});

// Bulk upload from CSV
app.post('/api/cafeteria/admin/food-items/bulk-upload', upload.single('csvFile'), async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }
    
    const filePath = req.file.path;
    const results = [];
    const failed = [];
    
    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          results.push(data);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // Process each row
    const successful = [];
    
    for (const row of results) {
      try {
        // Validate required fields
        if (!row.name || !row.price || !row.category || !row.quantity) {
          failed.push({
            row,
            error: 'Missing required fields (name, price, category, quantity)'
          });
          continue;
        }
        
        // Parse dietary tags
        let dietaryTags = [];
        if (row.dietaryTags) {
          dietaryTags = row.dietaryTags.split(',').map(tag => tag.trim());
        }
        
        // Create slug
        const slug = row.name.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        
        // Create food item
        const foodItem = new FoodItem({
          name: row.name,
          slug,
          description: row.description || '',
          shortDescription: row.shortDescription || '',
          price: parseFloat(row.price) || 0,
          discount: parseFloat(row.discount) || 0,
          quantity: parseInt(row.quantity) || 0,
          category: row.category,
          mealTime: row.mealTime || '',
          dietaryTags,
          image: '',
          status: row.status || 'active',
          featured: row.featured === 'true' || false,
          averageRating: 0,
          totalReviews: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await foodItem.save();
        successful.push(foodItem);
      } catch (error) {
        failed.push({
          row,
          error: error.message
        });
      }
    }
    
    // Clean up uploaded file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: `Bulk upload completed: ${successful.length} successful, ${failed.length} failed`,
      data: {
        successful: successful.length,
        failed: failed.length,
        details: failed
      }
    });
  } catch (error) {
    console.error('Error bulk uploading:', error);
    res.status(500).json({ success: false, message: 'Error bulk uploading', error: error.message });
  }
});

// ========== PUBLIC API ENDPOINTS ==========
// Get public food items for index.html
app.get('/api/cafeteria/food-items', async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    
    // Get active food items (excluding deleted)
    const activeItems = await FoodItem.find({ 
      status: { $in: ['active', 'out_of_stock'] }, // Include out_of_stock but show them differently
      quantity: { $gte: 0 } // Include items with 0 quantity (out of stock)
    })
    .sort({ featured: -1, name: 1 }) // Featured items first, then alphabetical
    .lean();
    
    // Format the items for the frontend
    const formattedItems = activeItems.map(item => ({
      _id: item._id.toString(),
      name: item.name,
      description: item.description || '',
      shortDescription: item.shortDescription || item.description?.substring(0, 100) + '...' || '',
      price: item.price || 0,
      discount: item.discount || 0,
      quantity: item.quantity || 0,
      category: item.category || 'main_course',
      mealTime: item.mealTime || '',
      dietaryTags: item.dietaryTags || [],
      image: item.image || 'default-food.jpg',
      status: item.status || 'active',
      featured: item.featured || false,
      averageRating: item.averageRating || 0,
      totalReviews: item.totalReviews || 0,
      slug: item.slug || item.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    
    res.json({
      success: true,
      data: {
        allItems: formattedItems,
        featured: formattedItems.filter(item => item.featured),
        regular: formattedItems.filter(item => !item.featured),
        categories: [...new Set(formattedItems.map(item => item.category))]
      }
    });
  } catch (error) {
    console.error('Error fetching public food items:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching food items',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get food item details by slug
app.get('/api/cafeteria/food-items/:slug', async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    const Review = mongoose.model('Review');
    
    const foodItem = await FoodItem.findOne({ slug: req.params.slug }).lean();
    
    if (!foodItem) {
      return res.status(404).json({ success: false, message: 'Food item not found' });
    }
    
    // Get reviews for this food item
    const reviews = await Review.find({ 
      foodItem: foodItem._id,
      status: 'active'
    }).sort({ createdAt: -1 }).lean();
    
    res.json({
      success: true,
      data: {
        ...foodItem,
        reviews
      }
    });
  } catch (error) {
    console.error('Error fetching food item details:', error);
    res.status(500).json({ success: false, message: 'Error fetching food item details' });
  }
});

// Get homepage data
app.get('/api/cafeteria/homepage', async (req, res) => {
  try {
    const FoodItem = mongoose.model('FoodItem');
    const Menu = mongoose.model('Menu');
    const Review = mongoose.model('Review');
    
    // Get today's date
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
    .populate('foodItems.item', 'name price image shortDescription')
    .lean();
    
    // Get featured food items
    const featuredItems = await FoodItem.find({
      featured: true,
      status: 'active'
    })
    .limit(4)
    .lean();
    
    // Get recent reviews
    const recentReviews = await Review.find({
      status: 'active'
    })
    .populate('foodItem', 'name')
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();
    
    res.json({
      success: true,
      data: {
        todaysMenu: todaysMenu || {
          date: today,
          mealType: 'lunch',
          cafeteria: 'main',
          foodItems: featuredItems.slice(0, 4).map(item => ({
            item: {
              _id: item._id,
              name: item.name,
              price: item.price,
              image: item.image || 'default-food.jpg',
              shortDescription: item.shortDescription || item.description?.substring(0, 60) + '...' || ''
            },
            available: item.quantity > 0,
            specialNote: ''
          }))
        },
        featuredItems: featuredItems.map(item => ({
          ...item,
          image: item.image || 'default-food.jpg'
        })),
        recentReviews: recentReviews.map(review => ({
          ...review,
          userName: review.userName || 'Anonymous',
          rating: review.rating || 5,
          comment: review.comment || 'Great food!',
          foodItem: review.foodItem || { name: 'Food Item' }
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching homepage data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Import other routes
const cafeteriaRoutes = require('./routes/CafeteriaRoutes');
app.use('/api/cafeteria', cafeteriaRoutes);

// Serve HTML files directly
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin/food-items.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'fooditem.html'));
});

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    endpoints: {
      homepage: '/api/cafeteria/homepage',
      submitReview: '/api/cafeteria/review',
      weeklyCalendar: '/api/cafeteria/menu/weekly-calendar',
      adminFoodItems: '/api/cafeteria/admin/food-items',
      publicFoodItems: '/api/cafeteria/food-items'
    }
  });
});

// Initialize test data after DB connection
mongoose.connection.once('open', () => {
  console.log('📦 Database connection established');
  insertTestData();
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err.message);
  
  // Multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // Other errors
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'API endpoint not found' 
  });
});

// Handle all other routes - serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
🌐 Open in browser: http://localhost:${PORT}
🔗 API Base URL: http://localhost:${PORT}/api/cafeteria
📁 Serving from: ${path.join(__dirname, 'public')}

🍽️  AVAILABLE ENDPOINTS:
   
   ADMIN ENDPOINTS:
   GET    /api/cafeteria/admin/food-items
   GET    /api/cafeteria/admin/food-items/:id
   POST   /api/cafeteria/admin/food-items
   PUT    /api/cafeteria/admin/food-items/:id
   DELETE /api/cafeteria/admin/food-items/:id
   PATCH  /api/cafeteria/admin/food-items/:id/featured
   DELETE /api/cafeteria/admin/food-items/bulk-delete
   POST   /api/cafeteria/admin/food-items/bulk-upload
   
   PUBLIC ENDPOINTS:
   GET    /api/cafeteria/food-items
   GET    /api/cafeteria/food-items/:slug
   GET    /api/cafeteria/homepage
   POST   /api/cafeteria/review
   
📂 Uploads directory: ${uploadsDir}
✅ Test server: http://localhost:${PORT}/api/test
✅ Admin interface: http://localhost:${PORT}/admin/food-items.html
`);
});