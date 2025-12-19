const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Menu = require('../models/Menu');
const FoodItem = require('../models/Fooditem');
const Review = require('../models/Review');

dotenv.config();

const clearDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bracu_cafeteria');
    
    console.log('🗑️  Clearing database...');
    
    const results = await Promise.all([
      Menu.deleteMany({}),
      FoodItem.deleteMany({}),
      Review.deleteMany({})
    ]);
    
    console.log('✅ Database cleared successfully');
    console.log(`   Menus removed: ${results[0].deletedCount}`);
    console.log(`   Food items removed: ${results[1].deletedCount}`);
    console.log(`   Reviews removed: ${results[2].deletedCount}`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
};

clearDatabase();