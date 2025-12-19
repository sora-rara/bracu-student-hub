// fix-slugs-simple.js
const mongoose = require('mongoose');
const FoodItem = require('./models/FoodItem');
require('dotenv').config();

async function fixSlugs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-hub');
        console.log('✅ Connected to MongoDB');

        // Get the collection directly to bypass Mongoose middleware
        const collection = mongoose.connection.db.collection('fooditems');

        // Find all documents
        const cursor = collection.find({});
        let updatedCount = 0;

        while (await cursor.hasNext()) {
            const doc = await cursor.next();

            // Skip if already has a slug
            if (doc.slug && doc.slug.trim() !== '') continue;

            // Generate new slug
            const name = doc.name || 'food-item';
            const baseSlug = name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+/, '')
                .replace(/-+$/, '');

            const slugBase = baseSlug || 'food-item';
            const newSlug = `${slugBase}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            // Update directly in collection
            await collection.updateOne(
                { _id: doc._id },
                { $set: { slug: newSlug } }
            );

            updatedCount++;
            console.log(`✅ Updated "${name}" with slug: ${newSlug}`);
        }

        console.log(`\n✅ Migration complete! Fixed ${updatedCount} items.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixSlugs();