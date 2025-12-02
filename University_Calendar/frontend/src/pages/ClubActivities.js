import React from 'react';
import EventList from '../components/EventList';

const ClubActivities = () => {
  return (
    <EventList 
      eventType="club"
      title="Club Activities"
      description="Student club events, meetings, and activities"
    />
  );
};

export default ClubActivities;