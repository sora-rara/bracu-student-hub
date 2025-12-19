
import React from 'react';
import GPACalculator from '../Dashboard/GPA/GPACalculator.jsx';

function GPACalculatorPage() {
  return <GPACalculator />;
}

// Add this function to sync with graduation planner
const syncWithGraduationPlanner = async () => {
  try {
    const response = await axios.post('/api/graduation/sync-grades');

    if (response.data.success) {
      // Show success message
      console.log('Grades synced with graduation planner');
    } else if (response.data.needsProgram) {
      // Ask user to set up program
      if (window.confirm('Please set up your graduation plan to track progress. Go to graduation planner?')) {
        window.location.href = '/graduation';
      }
    }
  } catch (error) {
    console.error('Error syncing with graduation planner:', error);
  }
};

// Call this function after saving grades
// In your handleSaveGrades function, add:
// await syncWithGraduationPlanner();

export default GPACalculatorPage;
