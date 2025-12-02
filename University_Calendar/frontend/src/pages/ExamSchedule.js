import React from 'react';
import EventList from '../components/EventList';

const ExamSchedule = () => {
  return (
    <EventList 
      eventType="exam"
      title="Exam Schedule"
      description="Mid-term, final exams, and other assessment schedules"
    />
  );
};

export default ExamSchedule;