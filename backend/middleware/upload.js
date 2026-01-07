
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Create different upload directories
const createUploadDirs = () => {
  const dirs = [
    path.join(__dirname, '..', 'public', 'uploads'), // General uploads
    path.join(__dirname, '..', 'public', 'uploads', 'textbooks'), // Textbooks
    path.join(__dirname, '..', 'public', 'uploads', 'food'), // Food items (existing)
    path.join(__dirname, '..', 'public', 'uploads', 'courses'), // Course content
    path.join(__dirname, '..', 'public', 'uploads', 'profiles') // Profile pictures
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
};

// Run on module load
createUploadDirs();

// ✅ Different storage configurations based on type
const createStorage = (folderName, prefix) => {
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads', folderName);
  
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname).toLowerCase();

      // Clean filename (remove special characters)
      const cleanName = file.originalname
        .replace(ext, '')
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()
        .substring(0, 50);

      // Use prefix if provided, otherwise use folder name
      const filePrefix = prefix || folderName;
      const filename = `${filePrefix}-${cleanName}-${uniqueSuffix}${ext}`;
      
      console.log(`📁 Saving ${folderName} file as: ${filename}`);
      cb(null, filename);
    }
  });
};

// ✅ File filter for images only
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log(`✅ Accepting ${file.fieldname}: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
  } else {
    console.log(`❌ Rejecting file: ${file.originalname} (${file.mimetype})`);
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

// ✅ Create storage instances
const textbookStorage = createStorage('textbooks', 'textbook');
const foodStorage = createStorage('food', 'food');
const courseStorage = createStorage('courses', 'course');
const profileStorage = createStorage('profiles', 'profile');
const genericStorage = createStorage('', 'file');

// ✅ Create multer instances
const createMulterInstance = (storage, fileFilter, limits) => {
  return multer({
    storage,
    fileFilter,
    limits
  });
};

// ✅ Create upload middleware functions
const upload = {
  // For textbook images (multiple files)
  textbookImages: createMulterInstance(
    textbookStorage,
    imageFilter,
    { fileSize: 5 * 1024 * 1024, files: 5 }
  ).array('images', 5),
  
  // For food items - FIXED: This needs to be a function that returns middleware
  foodItem: (req, res, next) => {
    return createMulterInstance(
      foodStorage,
      imageFilter,
      { fileSize: 5 * 1024 * 1024 }
    ).single('image')(req, res, next);
  },
  
  // For course content files
  courseContent: createMulterInstance(
    courseStorage,
    null,
    { fileSize: 10 * 1024 * 1024 }
  ).single('file'),
  
  // For profile pictures
  profilePicture: createMulterInstance(
    profileStorage,
    imageFilter,
    { fileSize: 2 * 1024 * 1024 }
  ).single('avatar'),
  
  // Generic single image upload - FIXED: This needs to be a function
  single: (fieldName = 'image') => {
    return (req, res, next) => {
      return createMulterInstance(
        genericStorage,
        imageFilter,
        { fileSize: 5 * 1024 * 1024 }
      ).single(fieldName)(req, res, next);
    };
  },
  
  // Generic multiple image upload
  array: (fieldName = 'images', maxCount = 10) => {
    return createMulterInstance(
      genericStorage,
      imageFilter,
      { fileSize: 5 * 1024 * 1024 }
    ).array(fieldName, maxCount);
  },
  
  // For CSV uploads
  csvUpload: createMulterInstance(
    genericStorage,
    (req, file, cb) => {
      if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'), false);
      }
    },
    { fileSize: 2 * 1024 * 1024 }
  ).single('csv')
};

// ✅ Helper function to get image URL
const getImageUrl = (filename, folder = '') => {
  if (!filename) return null;
  
  // If it's already a full URL, return as-is
  if (filename.startsWith('http')) return filename;
  
  // If it's a relative path, make it absolute
  if (filename.startsWith('/uploads/')) return filename;
  
  // Determine folder
  let finalFolder = folder;
  if (!finalFolder && filename.includes('textbook-')) finalFolder = 'textbooks';
  if (!finalFolder && filename.includes('food-')) finalFolder = 'food';
  if (!finalFolder && filename.includes('course-')) finalFolder = 'courses';
  if (!finalFolder && filename.includes('profile-')) finalFolder = 'profiles';
  
  // Construct URL
  if (finalFolder) {
    return `/uploads/${finalFolder}/${filename}`;
  } else {
    return `/uploads/${filename}`;
  }
};

// ✅ Helper function to delete image file
const deleteImageFile = (filename) => {
  try {
    // Try to find the file in all upload directories
    const possiblePaths = [
      path.join(__dirname, '..', 'public', 'uploads', filename),
      path.join(__dirname, '..', 'public', 'uploads', 'textbooks', filename),
      path.join(__dirname, '..', 'public', 'uploads', 'food', filename),
      path.join(__dirname, '..', 'public', 'uploads', 'courses', filename),
      path.join(__dirname, '..', 'public', 'uploads', 'profiles', filename)
    ];

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted file: ${filename}`);
        return true;
      }
    }
    
    console.log(`⚠️ File not found: ${filename}`);
    return false;
  } catch (error) {
    console.error(`❌ Error deleting file ${filename}:`, error.message);
    return false;
  }
};

// ✅ Export everything
module.exports = {
  upload,
  getImageUrl,
  deleteImageFile,
  // Direct exports for backward compatibility
  single: upload.single,
  array: upload.array,
  csvUpload: upload.csvUpload,
  textbookImages: upload.textbookImages,
  foodItem: upload.foodItem,
  courseContent: upload.courseContent,
  profilePicture: upload.profilePicture
};

// Debug info
console.log('📁 Upload system initialized');
console.log('📁 Upload directories created in:', path.join(__dirname, '..', 'public', 'uploads'));
console.log('✅ Multer middleware properly configured');
