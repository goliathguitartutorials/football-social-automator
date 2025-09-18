/*
 * ==========================================================
 * COMPONENT: CustomImagePost
 * PAGE: /
 * FILE: /components/CreatePage/CustomImagePost/CustomImagePost.js
 * ==========================================================
 */
'use client';
import { useState, useEffect } from 'react';
import CustomImageForm from '../../common/PostCreationForms/CustomImageForm/CustomImageForm';
import { useAppContext } from '../../../app/context/AppContext';
import styles from './CustomImagePost.module.css';

// Helper function to generate time slots
const generateTimeSlots = () => {
    const slots = [];
    for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 60; j += 15) {
            const hour = i.toString().padStart(2, '0');
            const minute = j.toString().padStart(2, '0');
            slots.push(`${hour}:${minute}`);
        }
    }
    return slots;
};

export default function CustomImagePost() {
    const { authKey } = useAppContext();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [timeSlots, setTimeSlots] = useState([]);
    
    // MODIFIED: State for UI feedback instead of alerts
    const [feedback, setFeedback] = useState({ message: '', type: '' });

    useEffect(() => {
        setTimeSlots(generateTimeSlots());
    }, []);
    
    // MODIFIED: Helper to manage feedback messages
    const showFeedback = (message, type) => {
        setFeedback({ message, type });
        setTimeout(() => {
            setFeedback({ message: '', type: '' });
        }, 5000); // Message disappears after 5 seconds
    };

    const handleSubmit = async ({ imageFile, caption, action }) => {
        if (!authKey) {
            showFeedback('Authorization key is not set. Please set it in Settings.', 'error');
            return;
        }
        setIsSubmitting(true);
        setFeedback({ message: '', type: '' }); // Clear previous feedback

        let endpoint = '';
        const formData = new FormData();
        
        if (action === 'post_now') {
            endpoint = '/api/post-now';
            formData.append('image', imageFile);
            formData.append('caption', caption);
            formData.append('action', action);

        } else if (action === 'schedule') {
            endpoint = '/api/schedule-custom-post';
            const localDateTime = new Date(`${selectedDate}T${selectedTime}`);
            formData.append('post_id', self.crypto.randomUUID());
            formData.append('image', imageFile);
            formData.append('caption', caption);
            formData.append('schedule_time_utc', localDateTime.toISOString());
            formData.append('action', action);
        } else {
            showFeedback('Invalid action specified.', 'error');
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authKey}`
                },
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                // Use error message from API response, or a default one
                throw new Error(result.error || 'Failed to submit post');
            }
            
            // MODIFIED: Show success message from API
            showFeedback(result.message || 'Action completed successfully!', 'success');

        } catch (error) {
            console.error(`Error submitting to ${endpoint}:`, error);
            // MODIFIED: Show error message
            showFeedback(`An error occurred: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            {/* NEW: Render feedback message if it exists */}
            {feedback.message && (
                <div className={`${styles.feedbackMessage} ${styles[feedback.type]}`}>
                    {feedback.message}
                </div>
            )}
            <CustomImageForm
                context="create"
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                selectedDate={selectedDate}
                onDateChange={(e) => setSelectedDate(e.target.value)}
                selectedTime={selectedTime}
                onTimeChange={(e) => setSelectedTime(e.target.value)}
                timeSlots={timeSlots}
            />
        </div>
    );
}
