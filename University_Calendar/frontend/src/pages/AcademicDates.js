import React from 'react';
import EventList from '../components/EventList';

const AcademicDates = () => {
  return (
    <EventList 
      eventType="academic"
      title="Academic Dates"
      description="Important academic dates, deadlines, and semester schedules"
    />
  );
};

export default AcademicDates;