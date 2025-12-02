import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import CalendarView from './pages/CalendarView';
import AddEvent from './pages/AddEvent'; // Import the actual component
import './App.css';

// Placeholder components for other pages
const Dashboard = () => (
  <div className="p-4">
    <h2>Dashboard</h2>
    <p>University calendar overview coming soon...</p>
  </div>
);

const AcademicDates = () => (
  <div className="p-4">
    <h2>Academic Dates</h2>
    <p>Important academic dates and deadlines will appear here.</p>
  </div>
);

const ClubActivities = () => (
  <div className="p-4">
    <h2>Club Activities</h2>
    <p>Club events and activities management coming soon...</p>
  </div>
);

const ExamSchedule = () => (
  <div className="p-4">
    <h2>Exam Schedule</h2>
    <p>Exam timetables and scheduling will appear here.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="academic" element={<AcademicDates />} />
          <Route path="clubs" element={<ClubActivities />} />
          <Route path="exams" element={<ExamSchedule />} />
          <Route path="addevent" element={<AddEvent />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;