const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Menu = require('../models/Menu');
const FoodItem = require('../models/Fooditem');
const Review = require('../models/Review');


dotenv.config();

// Sample BRACU-specific food items
const sampleFoodItems = [
  {
    name: "Chicken Biryani",
    slug: "chicken-biryani",
    description: "Traditional Bangladeshi biryani with aromatic rice, chicken pieces, and special spices. Served with borhani.",
    shortDescription: "Aromatic rice with chicken and spices",
    category: "main",
    price: 120,
    originalPrice: 140,
    discount: 14,
    image: {
      url: "https://images.unsplash.com/photo-1563379091339-03246963b608?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Chicken Biryani",
      thumbnail: "https://images.unsplash.com/photo-1563379091339-03246963b608?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 450,
      protein: 25,
      carbs: 55,
      fat: 15
    },
    dietaryTags: ["halal", "spicy"],
    preparationTime: 20,
    featured: true,
    popularity: 156,
    status: "active",
    seo: {
      title: "Chicken Biryani - BRACU Cafeteria",
      description: "Traditional Bangladeshi chicken biryani with aromatic rice and spices",
      keywords: ["biryani", "chicken", "spicy", "bangladeshi"]
    }
  },
  {
    name: "Vegetable Fried Rice",
    slug: "vegetable-fried-rice",
    description: "Healthy fried rice with mixed vegetables including carrots, peas, beans, and corn. Cooked with light soy sauce.",
    shortDescription: "Healthy fried rice with mixed veggies",
    category: "main",
    price: 80,
    image: {
      url: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Vegetable Fried Rice",
      thumbnail: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 320,
      protein: 8,
      carbs: 60,
      fat: 7
    },
    dietaryTags: ["vegetarian", "vegan", "halal"],
    preparationTime: 15,
    featured: true,
    popularity: 89,
    status: "active"
  },
  {
    name: "Beef Burger",
    slug: "beef-burger",
    description: "Juicy beef patty with cheese, lettuce, tomato, and special sauce. Served with french fries.",
    shortDescription: "Classic beef burger with fries",
    category: "main",
    price: 150,
    image: {
      url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Beef Burger",
      thumbnail: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 550,
      protein: 30,
      carbs: 45,
      fat: 25
    },
    dietaryTags: ["halal"],
    preparationTime: 10,
    featured: false,
    popularity: 203,
    status: "active"
  },
  {
    name: "Chicken Chow Mein",
    slug: "chicken-chow-mein",
    description: "Stir-fried noodles with chicken strips, cabbage, carrots, and spring onions in soy sauce.",
    shortDescription: "Chicken noodles with vegetables",
    category: "main",
    price: 100,
    image: {
      url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Chicken Chow Mein",
      thumbnail: "https://images.unsplash.com/photo-1585032226651-759b368d7246?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 380,
      protein: 22,
      carbs: 50,
      fat: 12
    },
    dietaryTags: ["halal"],
    preparationTime: 12,
    popularity: 134,
    status: "active"
  },
  {
    name: "Faluda",
    slug: "faluda",
    description: "Traditional Bangladeshi dessert drink with vermicelli, basil seeds, rose syrup, and milk. Topped with ice cream.",
    shortDescription: "Traditional dessert drink",
    category: "beverage",
    price: 60,
    image: {
      url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Faluda",
      thumbnail: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 280,
      protein: 5,
      carbs: 45,
      fat: 8
    },
    dietaryTags: ["vegetarian", "halal"],
    preparationTime: 8,
    featured: true,
    popularity: 92,
    status: "active"
  },
  {
    name: "French Fries",
    slug: "french-fries",
    description: "Crispy golden french fries served with ketchup and mayonnaise.",
    shortDescription: "Crispy golden fries",
    category: "side",
    price: 50,
    image: {
      url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "French Fries",
      thumbnail: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 310,
      protein: 4,
      carbs: 40,
      fat: 15
    },
    dietaryTags: ["vegetarian", "vegan", "halal"],
    preparationTime: 7,
    popularity: 178,
    status: "active"
  },
  {
    name: "Chicken Soup",
    slug: "chicken-soup",
    description: "Hot and healthy chicken soup with vegetables and herbs. Perfect for a light meal.",
    shortDescription: "Healthy chicken vegetable soup",
    category: "appetizer",
    price: 70,
    image: {
      url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Chicken Soup",
      thumbnail: "https://images.unsplash.com/photo-1547592166-23ac45744acd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 120,
      protein: 10,
      carbs: 8,
      fat: 5
    },
    dietaryTags: ["halal"],
    preparationTime: 10,
    popularity: 67,
    status: "active"
  },
  {
    name: "Chocolate Cake",
    slug: "chocolate-cake",
    description: "Moist chocolate cake with chocolate frosting. Perfect for dessert.",
    shortDescription: "Decadent chocolate cake",
    category: "dessert",
    price: 90,
    originalPrice: 100,
    discount: 10,
    image: {
      url: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Chocolate Cake",
      thumbnail: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 350,
      protein: 5,
      carbs: 45,
      fat: 18
    },
    dietaryTags: ["vegetarian", "halal"],
    preparationTime: 0,
    featured: true,
    popularity: 145,
    status: "active"
  },
  {
    name: "Mango Lassi",
    slug: "mango-lassi",
    description: "Refreshing yogurt-based drink with fresh mango pulp.",
    shortDescription: "Refreshing mango yogurt drink",
    category: "beverage",
    price: 65,
    image: {
      url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Mango Lassi",
      thumbnail: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 180,
      protein: 6,
      carbs: 30,
      fat: 4
    },
    dietaryTags: ["vegetarian", "halal"],
    preparationTime: 5,
    popularity: 98,
    status: "active"
  },
  {
    name: "Vegetable Curry",
    slug: "vegetable-curry",
    description: "Mixed vegetables cooked in traditional Bangladeshi curry sauce. Served with rice.",
    shortDescription: "Mixed vegetable curry",
    category: "main",
    price: 85,
    image: {
      url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Vegetable Curry",
      thumbnail: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 280,
      protein: 7,
      carbs: 35,
      fat: 12
    },
    dietaryTags: ["vegetarian", "vegan", "halal"],
    preparationTime: 15,
    popularity: 76,
    status: "active"
  },
  {
    name: "Grilled Chicken",
    slug: "grilled-chicken",
    description: "Tender chicken pieces marinated in herbs and spices, grilled to perfection.",
    shortDescription: "Herb-marinated grilled chicken",
    category: "main",
    price: 130,
    image: {
      url: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      alt: "Grilled Chicken",
      thumbnail: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
    },
    nutritionalInfo: {
      calories: 320,
      protein: 35,
      carbs: 5,
      fat: 18
    },
    dietaryTags: ["halal"],
    preparationTime: 18,
    featured: true,
    popularity: 167,
    status: "active"
  }
];

// Sample reviews
const sampleReviews = [
  {
    userName: "Rahim Ahmed",
    userEmail: "rahim@bracu.ac.bd",
    rating: 5,
    comment: "Best chicken biryani on campus! Highly recommended.",
    status: "active"
  },
  {
    userName: "Sadia Islam",
    userEmail: "sadia@bracu.ac.bd",
    rating: 4,
    comment: "Vegetable fried rice is healthy and tasty. Good portion size.",
    status: "active"
  },
  {
    userName: "Tanvir Hossain",
    userEmail: "tanvir@bracu.ac.bd",
    rating: 5,
    comment: "Beef burger is amazing! Better than many fast food chains.",
    status: "active"
  },
  {
    userName: "Nusrat Jahan",
    userEmail: "nusrat@bracu.ac.bd",
    rating: 4,
    comment: "Faluda is perfect for Dhaka's hot weather. Very refreshing.",
    status: "active"
  },
  {
    userName: "Imran Khan",
    userEmail: "imran@bracu.ac.bd",
    rating: 3,
    comment: "French fries could be crispier. Good taste though.",
    status: "active"
  },
  {
    userName: "Farhana Akter",
    userEmail: "farhana@bracu.ac.bd",
    rating: 5,
    comment: "Chocolate cake is to die for! Perfectly moist and sweet.",
    status: "active"
  },
  {
    userName: "Kamal Uddin",
    userEmail: "kamal@bracu.ac.bd",
    rating: 4,
    comment: "Mango lassi is authentic and delicious. Great value.",
    status: "active"
  },
  {
    userName: "Tasnim Rahman",
    userEmail: "tasnim@bracu.ac.bd",
    rating: 5,
    comment: "Vegetable curry is perfect for vegetarians. Spicy and flavorful.",
    status: "active"
  },
  {
    userName: "Arif Mahmud",
    userEmail: "arif@bracu.ac.bd",
    rating: 4,
    comment: "Grilled chicken is healthy and tasty. Good protein option.",
    status: "active"
  },
  {
    userName: "Saima Chowdhury",
    userEmail: "saima@bracu.ac.bd",
    rating: 5,
    comment: "Chicken chow mein is my go-to lunch. Always fresh!",
    status: "active"
  }
];

// Helper function to get dates
const getDate = (daysFromToday = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  date.setHours(0, 0, 0, 0);
  return date;
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bracu_cafeteria');
    console.log('✅ MongoDB Connected for Seeding');
    return true;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    return false;
  }
};

const clearDatabase = async () => {
  try {
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Menu.deleteMany({}),
      FoodItem.deleteMany({}),
      Review.deleteMany({})
    ]);
    console.log('✅ Database cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    return false;
  }
};

const seedFoodItems = async () => {
  try {
    console.log('🌱 Seeding food items...');
    const foodItems = await FoodItem.insertMany(sampleFoodItems);
    console.log(`✅ Inserted ${foodItems.length} food items`);
    return foodItems;
  } catch (error) {
    console.error('❌ Error seeding food items:', error.message);
    return [];
  }
};

const seedReviews = async (foodItems) => {
  try {
    console.log('📝 Seeding reviews...');
    const reviews = [];
    
    // Create 3-5 reviews for each food item
    foodItems.forEach((item, index) => {
      const numReviews = Math.floor(Math.random() * 3) + 3; // 3-5 reviews per item
      
      for (let i = 0; i < numReviews; i++) {
        const reviewIndex = (index + i) % sampleReviews.length;
        const baseReview = sampleReviews[reviewIndex];
        
        reviews.push({
          foodItem: item._id,
          userName: baseReview.userName,
          userEmail: baseReview.userEmail,
          rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
          comment: `${baseReview.comment} #${i + 1}`,
          status: 'active',
          createdAt: new Date(Date.now() - i * 86400000) // Recent dates
        });
      }
    });
    
    const insertedReviews = await Review.insertMany(reviews);
    console.log(`✅ Inserted ${insertedReviews.length} reviews`);
    return insertedReviews;
  } catch (error) {
    console.error('❌ Error seeding reviews:', error.message);
    return [];
  }
};

const updateFoodItemRatings = async (foodItems) => {
  try {
    console.log('⭐ Updating food item ratings...');
    
    for (const item of foodItems) {
      const reviews = await Review.find({ foodItem: item._id });
      
      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;
        
        await FoodItem.findByIdAndUpdate(item._id, {
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews: reviews.length,
          popularity: Math.floor(Math.random() * 100) + 50 // Random popularity 50-150
        });
      }
    }
    
    console.log('✅ Food item ratings updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating ratings:', error.message);
    return false;
  }
};

const seedMenus = async (foodItems) => {
  try {
    console.log('📅 Seeding menus...');
    
    const menus = [];
    const today = new Date();
    
    // Create menus for today and next 6 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(0, 0, 0, 0);
      
      // Create breakfast, lunch, and dinner for each cafeteria
      const cafeterias = ['main', 'annex', 'ub', 'faculty'];
      const mealTypes = ['breakfast', 'lunch', 'dinner'];
      
      cafeterias.forEach(cafeteria => {
        mealTypes.forEach(mealType => {
          // Select 4-6 random food items for this menu
          const shuffled = [...foodItems].sort(() => 0.5 - Math.random());
          const selectedItems = shuffled.slice(0, Math.floor(Math.random() * 3) + 4);
          
          menus.push({
            date,
            mealType,
            cafeteria,
            foodItems: selectedItems.map(item => ({
              item: item._id,
              available: Math.random() > 0.1, // 90% available
              specialNote: Math.random() > 0.7 ? 'Chef\'s Special' : undefined
            })),
            status: 'published',
            views: Math.floor(Math.random() * 50) + 10 // 10-60 views
          });
        });
      });
    }
    
    const insertedMenus = await Menu.insertMany(menus);
    console.log(`✅ Inserted ${insertedMenus.length} menus`);
    return insertedMenus;
  } catch (error) {
    console.error('❌ Error seeding menus:', error.message);
    return [];
  }
};

const seedDatabase = async () => {
  console.log('\n🚀 Starting BRACU Cafeteria Database Seeding\n');
  
  // Connect to database
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }
  
  // Clear existing data
  const cleared = await clearDatabase();
  if (!cleared) {
    process.exit(1);
  }
  
  // Seed food items
  const foodItems = await seedFoodItems();
  if (foodItems.length === 0) {
    process.exit(1);
  }
  
  // Seed reviews
  const reviews = await seedReviews(foodItems);
  
  // Update ratings
  await updateFoodItemRatings(foodItems);
  
  // Seed menus
  const menus = await seedMenus(foodItems);
  
  // Summary
  console.log('\n🎉 Database Seeding Completed Successfully!\n');
  console.log('📊 Summary:');
  console.log(`   Food Items: ${foodItems.length}`);
  console.log(`   Reviews: ${reviews.length}`);
  console.log(`   Menus: ${menus.length}`);
  
  console.log('\n🍽️  Sample Food Items:');
  foodItems.slice(0, 5).forEach(item => {
    console.log(`   - ${item.name}: ৳${item.price} ⭐ ${item.averageRating || 'N/A'}`);
  });
  
  console.log('\n📅 Sample Menu Dates:');
  const uniqueDates = [...new Set(menus.map(m => m.date.toDateString()))].slice(0, 3);
  uniqueDates.forEach(date => {
    console.log(`   - ${date}`);
  });
  
  console.log('\n🔗 Frontend URL: http://localhost:3000');
  console.log('🔗 Backend URL: http://localhost:5000\n');
  
  mongoose.disconnect();
  process.exit(0);
};

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node databaseSeeder.js [options]

Options:
  --help, -h     Show this help message
  --clear, -c    Clear database only
  --seed, -s     Seed database only (without clearing)
  `);
  process.exit(0);
}

if (args.includes('--clear') || args.includes('-c')) {
  connectDB().then(async () => {
    await clearDatabase();
    mongoose.disconnect();
    process.exit(0);
  });
} else if (args.includes('--seed') || args.includes('-s')) {
  connectDB().then(async () => {
    const foodItems = await seedFoodItems();
    await seedReviews(foodItems);
    await updateFoodItemRatings(foodItems);
    await seedMenus(foodItems);
    mongoose.disconnect();
    process.exit(0);
  });
} else {
  // Run full seed
  seedDatabase().catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}