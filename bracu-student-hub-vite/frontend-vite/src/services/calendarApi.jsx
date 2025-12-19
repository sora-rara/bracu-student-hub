import axios from '../api/axios.jsx';

const API_BASE_URL = 'http://localhost:5000/api/calendar';

export const calendarApi = {
    // Get all events
    getAllEvents: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/events`);
            return response.data;
        } catch (error) {
            console.error('Error fetching events:', error);
            return { success: false, events: [] };
        }
    },

    // Get events by type - FIXED
    getEventsByType: async (type) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/events/type/${type}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching events by type:', error);
            return { success: false, events: [] };
        }
    },

    // Create event - ADD MORE DEBUGGING
    createEvent: async (eventData) => {
        try {
            console.log('📡 calendarApi.createEvent called with:', eventData);
            const response = await axios.post(`${API_BASE_URL}/events`, eventData);
            console.log('✅ calendarApi.createEvent response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ calendarApi.createEvent error:', error.response || error);
            throw error.response?.data || error;
        }
    },
    // Update event
    updateEvent: async (id, eventData) => {
        try {
            const response = await axios.put(`${API_BASE_URL}/events/${id}`, eventData);
            return response.data;
        } catch (error) {
            console.error('Error updating event:', error);
            throw error.response?.data || error;
        }
    },

    // Delete event - ADD MORE DEBUGGING
    deleteEvent: async (id) => {
        try {
            console.log('🗑️ calendarApi.deleteEvent called with id:', id);
            const response = await axios.delete(`${API_BASE_URL}/events/${id}`);
            console.log('✅ calendarApi.deleteEvent response:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ calendarApi.deleteEvent error:', error.response || error);
            throw error.response?.data || error;
        }
    }
};

export default calendarApi;