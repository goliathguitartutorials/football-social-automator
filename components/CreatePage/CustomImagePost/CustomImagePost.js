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

    useEffect(() => {
        setTimeSlots(generateTimeSlots());
    }, []);

    const handleSubmit = async ({ imageFile, caption, action }) => {
        if (!authKey) {
            alert('Authorization key is not set. Please set it in the Settings page.');
            return;
        }
        setIsSubmitting(true);

        let endpoint = '';
        const formData = new FormData();
        
        // ==========================================================
        // MODIFIED: Conditionally set the endpoint and build the payload
        // ==========================================================
        if (action === 'post_now') {
            endpoint = '/api/post-now';
            formData.append('image', imageFile);
            formData.append('caption', caption);
            formData.append('action', action);

        } else if (action === 'schedule') {
            endpoint = '/api/schedule-custom-post';
            const localDateTime = new Date(`${selectedDate}T${selectedTime}`);
            
            // NOTE: The schedule-custom-post API expects a 'post_id'.
            // We'll generate a unique ID on the client-side for new posts.
            formData.append('post_id', self.crypto.randomUUID());
            formData.append('image', imageFile);
            formData.append('caption', caption);
            formData.append('schedule_time_utc', localDateTime.toISOString());
            formData.append('action', action);
        } else {
            alert('Invalid action specified.');
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

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit post');
            }

            const result = await response.json();
            alert(result.message || 'Action completed successfully!');

        } catch (error) {
            console.error(`Error submitting to ${endpoint}:`, error);
            alert(`An error occurred: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
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
