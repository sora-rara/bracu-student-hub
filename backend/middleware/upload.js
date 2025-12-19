const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ✅ Store in public/uploads directory
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Multer: Created uploads directory:', uploadDir);
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();

    // Clean filename
    const cleanName = file.originalname
      .replace(ext, '')
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .substring(0, 50);

    const filename = `food-${cleanName}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log('✅ Accepting file:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ Rejecting file:', file.originalname);
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// For CSV uploads (if needed)
const csvUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

module.exports = {
  upload,
  csvUpload
};

// In upload.js, add this:
console.log('📁 Upload directory absolute path:', uploadDir);
console.log('📁 Upload directory exists:', fs.existsSync(uploadDir));