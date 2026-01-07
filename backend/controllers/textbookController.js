const Textbook = require('../models/Textbook');
const User = require('../models/User');
const { deleteImageFile } = require('../middleware/upload');

// @desc    Get all textbooks with filters
// @route   GET /api/textbooks
// @access  Public
exports.getTextbooks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status = 'Available',
      courseCode,
      transactionType,
      condition,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { status };

    if (courseCode) filter.courseCode = courseCode;
    if (transactionType) filter.transactionType = transactionType;
    if (condition) filter.condition = condition;

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { courseCode: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const textbooks = await Textbook.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('sellerId', 'name email profilePicture')
      .lean();

    // Get total count for pagination
    const total = await Textbook.countDocuments(filter);

    res.json({
      success: true,
      data: textbooks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching textbooks:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching textbooks'
    });
  }
};

// @desc    Get single textbook by ID
// @route   GET /api/textbooks/:id
// @access  Public
exports.getTextbookById = async (req, res) => {
  try {
    const textbook = await Textbook.findById(req.params.id)
      .populate('sellerId', 'name email profilePicture rating reviewsCount joinedAt')
      .lean();

    if (!textbook) {
      return res.status(404).json({
        success: false,
        error: 'Textbook not found'
      });
    }

    // Increment view count
    await Textbook.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    res.json({
      success: true,
      data: textbook
    });
  } catch (error) {
    console.error('Error fetching textbook:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching textbook'
    });
  }
};

// @desc    Create new textbook listing
// @route   POST /api/textbooks
// @access  Private
exports.createTextbook = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Process uploaded images
    const images = req.files ? req.files.map(file => file.filename) : [];

    // Parse JSON fields that might come as strings
    let tags = [];
    if (req.body.tags) {
      if (typeof req.body.tags === 'string') {
        tags = JSON.parse(req.body.tags);
      } else if (Array.isArray(req.body.tags)) {
        tags = req.body.tags;
      }
    }

    const textbookData = {
      ...req.body,
      images: images,
      tags: tags,
      sellerId: req.userId,
      sellerName: user.name,
      sellerEmail: user.email
    };

    // Convert string fields to numbers where needed
    if (textbookData.price) textbookData.price = parseFloat(textbookData.price);
    if (textbookData.edition && !isNaN(textbookData.edition)) {
      textbookData.edition = parseInt(textbookData.edition);
    }

    const textbook = await Textbook.create(textbookData);

    res.status(201).json({
      success: true,
      data: textbook,
      message: 'Textbook listing created successfully'
    });
  } catch (error) {
    console.error('Error creating textbook:', error);
    
    // Clean up uploaded files if there's an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteImageFile(file.filename);
      });
    }
    
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create textbook listing'
    });
  }
};

// @desc    Update textbook listing
// @route   PUT /api/textbooks/:id
// @access  Private (Owner or Admin)
exports.updateTextbook = async (req, res) => {
  try {
    let textbook = await Textbook.findById(req.params.id);

    if (!textbook) {
      return res.status(404).json({
        success: false,
        error: 'Textbook not found'
      });
    }

    // Check ownership or admin status
    if (textbook.sellerId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this listing'
      });
    }

    // Process uploaded images
    let newImages = [];
    if (req.files && req.files.length > 0) {
      newImages = req.files.map(file => file.filename);
    }

    // Keep existing images unless they were removed
    let existingImages = textbook.images || [];
    if (req.body.existingImages) {
      try {
        existingImages = Array.isArray(req.body.existingImages) 
          ? req.body.existingImages 
          : JSON.parse(req.body.existingImages);
      } catch (e) {
        console.error('Error parsing existingImages:', e);
        existingImages = textbook.images;
      }
    }

    // Combine existing and new images, remove duplicates
    const allImages = [...existingImages, ...newImages].filter((img, index, self) => 
      self.indexOf(img) === index
    );

    // Parse tags
    let tags = textbook.tags || [];
    if (req.body.tags) {
      if (typeof req.body.tags === 'string') {
        try {
          tags = JSON.parse(req.body.tags);
        } catch (e) {
          // If JSON parse fails, try comma-separated string
          tags = req.body.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
      } else if (Array.isArray(req.body.tags)) {
        tags = req.body.tags;
      }
    }

    // Prepare update data
    const updateData = {
      ...req.body,
      images: allImages,
      tags: tags
    };

    // Don't allow updating certain fields
    delete updateData.sellerId;
    delete updateData.sellerName;
    delete updateData.sellerEmail;

    // Convert string fields to numbers where needed
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.edition && !isNaN(updateData.edition)) {
      updateData.edition = parseInt(updateData.edition);
    }

    // Clean up images that were removed
    const removedImages = textbook.images.filter(img => !allImages.includes(img));
    removedImages.forEach(img => deleteImageFile(img));

    textbook = await Textbook.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: textbook,
      message: 'Textbook listing updated successfully'
    });
  } catch (error) {
    console.error('Error updating textbook:', error);
    
    // Clean up uploaded files if there's an error
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        deleteImageFile(file.filename);
      });
    }
    
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update textbook listing'
    });
  }
};

// @desc    Delete textbook listing
// @route   DELETE /api/textbooks/:id
// @access  Private (Owner or Admin)
exports.deleteTextbook = async (req, res) => {
  try {
    const textbook = await Textbook.findById(req.params.id);

    if (!textbook) {
      return res.status(404).json({
        success: false,
        error: 'Textbook not found'
      });
    }

    // Check ownership or admin status
    if (textbook.sellerId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this listing'
      });
    }

    // Delete associated image files
    if (textbook.images && textbook.images.length > 0) {
      textbook.images.forEach(img => deleteImageFile(img));
    }

    await textbook.deleteOne();

    res.json({
      success: true,
      message: 'Textbook listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting textbook:', error);
    res.status(500).json({
      success: false,
      error: 'Server error deleting textbook'
    });
  }
};

// @desc    Get user's textbook listings
// @route   GET /api/textbooks/user/my-listings
// @access  Private
exports.getMyListings = async (req, res) => {
  try {
    const textbooks = await Textbook.find({ sellerId: req.userId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: textbooks
    });
  } catch (error) {
    console.error('Error fetching user listings:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching listings'
    });
  }
};

// @desc    Toggle favorite status
// @route   POST /api/textbooks/:id/toggle-favorite
// @access  Private
exports.toggleFavorite = async (req, res) => {
  try {
    const textbook = await Textbook.findById(req.params.id);

    if (!textbook) {
      return res.status(404).json({
        success: false,
        error: 'Textbook not found'
      });
    }

    const isFavorited = textbook.favorites.includes(req.userId);
    let update;

    if (isFavorited) {
      update = { $pull: { favorites: req.userId } };
    } else {
      update = { $addToSet: { favorites: req.userId } };
    }

    await Textbook.findByIdAndUpdate(req.params.id, update);

    res.json({
      success: true,
      data: {
        isFavorited: !isFavorited,
        favoriteCount: isFavorited ? textbook.favorites.length - 1 : textbook.favorites.length + 1
      },
      message: isFavorited ? 'Removed from favorites' : 'Added to favorites'
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({
      success: false,
      error: 'Server error updating favorites'
    });
  }
};

// @desc    Get user's favorite textbooks
// @route   GET /api/textbooks/user/favorites
// @access  Private
exports.getFavorites = async (req, res) => {
  try {
    const textbooks = await Textbook.find({ favorites: req.userId })
      .sort({ createdAt: -1 })
      .populate('sellerId', 'name email profilePicture')
      .lean();

    res.json({
      success: true,
      data: textbooks
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching favorites'
    });
  }
};

// @desc    Update textbook status
// @route   PATCH /api/textbooks/:id/status
// @access  Private (Owner or Admin)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const textbook = await Textbook.findById(req.params.id);

    if (!textbook) {
      return res.status(404).json({
        success: false,
        error: 'Textbook not found'
      });
    }

    // Check ownership or admin status
    if (textbook.sellerId.toString() !== req.userId && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update status'
      });
    }

    textbook.status = status;
    await textbook.save();

    res.json({
      success: true,
      data: textbook,
      message: `Status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update status'
    });
  }
};

// @desc    Get textbooks by course
// @route   GET /api/textbooks/course/:courseCode
// @access  Public
exports.getTextbooksByCourse = async (req, res) => {
  try {
    const textbooks = await Textbook.find({
      courseCode: req.params.courseCode.toUpperCase(),
      status: 'Available'
    })
      .sort({ price: 1, createdAt: -1 })
      .populate('sellerId', 'name email profilePicture')
      .limit(50)
      .lean();

    res.json({
      success: true,
      data: textbooks
    });
  } catch (error) {
    console.error('Error fetching textbooks by course:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching textbooks'
    });
  }
};

// @desc    Get statistics
// @route   GET /api/textbooks/stats
// @access  Public
exports.getStats = async (req, res) => {
  try {
    const stats = await Textbook.aggregate([
      {
        $match: { status: 'Available' }
      },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      }
    ]);

    const courseStats = await Textbook.aggregate([
      {
        $match: { status: 'Available' }
      },
      {
        $group: {
          _id: '$courseCode',
          count: { $sum: 1 },
          averagePrice: { $avg: '$price' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || { totalListings: 0, averagePrice: 0, minPrice: 0, maxPrice: 0 },
        popularCourses: courseStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching statistics'
    });
  }
};

// @desc    Search textbooks
// @route   GET /api/textbooks/search/:query
// @access  Public
exports.searchTextbooks = async (req, res) => {
  try {
    const { query } = req.params;
    
    const textbooks = await Textbook.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { author: { $regex: query, $options: 'i' } },
        { courseCode: { $regex: query, $options: 'i' } },
        { courseName: { $regex: query, $options: 'i' } },
        { isbn: { $regex: query, $options: 'i' } }
      ],
      status: 'Available'
    })
      .sort({ createdAt: -1 })
      .populate('sellerId', 'name email profilePicture')
      .limit(20)
      .lean();

    res.json({
      success: true,
      data: textbooks
    });
  } catch (error) {
    console.error('Error searching textbooks:', error);
    res.status(500).json({
      success: false,
      error: 'Server error searching textbooks'
    });
  }
};

// @desc    Get featured textbooks
// @route   GET /api/textbooks/featured
// @access  Public
exports.getFeaturedTextbooks = async (req, res) => {
  try {
    const textbooks = await Textbook.find({
      featured: true,
      status: 'Available'
    })
      .sort({ createdAt: -1 })
      .populate('sellerId', 'name email profilePicture')
      .limit(6)
      .lean();

    res.json({
      success: true,
      data: textbooks
    });
  } catch (error) {
    console.error('Error fetching featured textbooks:', error);
    res.status(500).json({
      success: false,
      error: 'Server error fetching featured textbooks'
    });
  }
};