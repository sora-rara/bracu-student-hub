const programSeeder = require('./programSeeder');

const runAllSeeders = async () => {
    console.log('🚀 Running all seeders...');

    try {
        await programSeeder();
        console.log('All seeders completed successfully!');
    } catch (error) {
        console.error('Error running seeders:', error);
        process.exit(1);
    }
};

// Run if called directly
if (require.main === module) {
    runAllSeeders();
}

module.exports = {
    runAllSeeders,
    programSeeder
};